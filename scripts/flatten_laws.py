"""
Project Access - Law Data Flattening Utility
===========================================
Flattens structured legal JSON files (Criminal and Civil) into unified *_flattened.json files
compatible with the Qdrant indexer.
"""

import json
import os
import glob
from typing import Dict, List, Any

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
CRIMINAL_DIR = os.path.join(BASE_DIR, "criminal")
CIVIL_DIR = os.path.join(BASE_DIR, "civil")


def extract_text(p_data: Any) -> str:
    text_parts = []
    if isinstance(p_data, str):
        text_parts.append(p_data)
    elif isinstance(p_data, dict):
        if 'text' in p_data:
            text_parts.append(str(p_data['text']))
        if 'contains' in p_data:
            for k, v in p_data['contains'].items():
                text_parts.append(extract_text(v))
    elif isinstance(p_data, list):
        for v in p_data:
            text_parts.append(extract_text(v))
    return " ".join(text_parts)


def parse_section_dict(section_dict: Dict[str, Any], chapter_label: str, act_id: str, act_title: str) -> List[Dict[str, Any]]:
    flat = []
    if not isinstance(section_dict, dict):
        return flat
    for sec_key, sec_val in section_dict.items():
        if isinstance(sec_val, str):
            sec_num = sec_key.replace("Section", "").replace(".", "").strip()
            flat.append({
                "section_number": sec_num,
                "section_title": "",
                "chapter": chapter_label,
                "text": f"{sec_key}\n{sec_val}",
                "source_label": f"Section {sec_num}, {act_title}",
                "chunk_id": f"{act_id}_{sec_num}"
            })
            continue

        sec_heading = sec_val.get("heading", "") if isinstance(sec_val, dict) else ""
        paragraphs = sec_val.get("paragraphs", {}) if isinstance(sec_val, dict) else {}
        full_text = []
        if isinstance(paragraphs, dict):
            for p_idx, p_data in paragraphs.items():
                full_text.append(extract_text(p_data))
        elif isinstance(paragraphs, list):
            for p_data in paragraphs:
                full_text.append(extract_text(p_data))
        combined_text = "\n".join(full_text)
        sec_num = str(sec_val.get("number", sec_key)).replace("Section", "").replace(".", "").strip() if isinstance(sec_val, dict) else str(sec_key).replace("Section", "").replace(".", "").strip()
        flat.append({
            "section_number": sec_num,
            "section_title": sec_heading,
            "chapter": chapter_label,
            "text": f"Section {sec_num} {sec_heading}\n{combined_text}".strip(),
            "source_label": f"Section {sec_num}, {act_title}",
            "chunk_id": f"{act_id}_{sec_num}"
        })
    return flat


def find_all_sections_in_container(container: Dict[str, Any], label: str, act_id: str, act_title: str) -> List[Dict[str, Any]]:
    flat = []
    if not isinstance(container, dict):
        return flat

    if "Sections" in container:
        flat.extend(parse_section_dict(container["Sections"], label, act_id, act_title))

    subheadings = container.get("Subheadings", [])
    if isinstance(subheadings, list):
        for sub in subheadings:
            if isinstance(sub, dict):
                sub_label = f"{label} - {sub.get('Name', '')}".strip(" -")
                flat.extend(find_all_sections_in_container(sub, sub_label, act_id, act_title))

    chapters = container.get("Chapters", {})
    if isinstance(chapters, dict):
        for c_key, c_val in chapters.items():
            if isinstance(c_val, dict):
                c_label = f"{label} - {c_val.get('ID', '')} {c_val.get('Name', '')}".strip(" -")
                flat.extend(find_all_sections_in_container(c_val, c_label, act_id, act_title))
    elif isinstance(chapters, list):
        for c_val in chapters:
            if isinstance(c_val, dict):
                c_label = f"{label} - {c_val.get('ID', '')} {c_val.get('Name', '')}".strip(" -")
                flat.extend(find_all_sections_in_container(c_val, c_label, act_id, act_title))

    return flat


def parse_legal_json(data: Any, act_id: str, act_title: str) -> List[Dict[str, Any]]:
    flat_sections = []
    if isinstance(data, list):
        for sec in data:
            sec_num = str(sec.get("section_number", sec.get("number", "")))
            flat_sections.append({
                "section_number": sec_num,
                "section_title": sec.get("section_title", sec.get("title", sec.get("heading", ""))),
                "chapter": sec.get("chapter", ""),
                "text": sec.get("text", ""),
                "source_label": f"Section {sec_num}, {act_title}",
                "chunk_id": f"{act_id}_{sec_num}"
            })
        return flat_sections

    if isinstance(data, dict) and "sections" in data and isinstance(data["sections"], list):
        for sec in data["sections"]:
            sec_num = str(sec.get("section_number", sec.get("number", "")))
            flat_sections.append({
                "section_number": sec_num,
                "section_title": sec.get("section_title", sec.get("title", sec.get("heading", ""))),
                "chapter": sec.get("chapter", ""),
                "text": sec.get("text", ""),
                "source_label": f"Section {sec_num}, {act_title}",
                "chunk_id": f"{act_id}_{sec_num}"
            })
        return flat_sections

    # Process Parts
    parts = data.get("Parts", {}) if isinstance(data, dict) else {}
    if parts:
        if isinstance(parts, dict):
            for p_key, p_val in parts.items():
                p_label = p_val.get("Name", "") if isinstance(p_val, dict) else ""
                flat_sections.extend(find_all_sections_in_container(p_val, p_label, act_id, act_title))
        elif isinstance(parts, list):
            for p_val in parts:
                p_label = p_val.get("Name", "") if isinstance(p_val, dict) else ""
                flat_sections.extend(find_all_sections_in_container(p_val, p_label, act_id, act_title))

    # Process Chapters
    if not flat_sections:
        chapters = data.get("Chapters", {}) if isinstance(data, dict) else {}
        if chapters:
            if isinstance(chapters, dict):
                for c_key, c_val in chapters.items():
                    c_label = f"{c_val.get('ID', '')} {c_val.get('Name', '')}".strip() if isinstance(c_val, dict) else ""
                    flat_sections.extend(find_all_sections_in_container(c_val, c_label, act_id, act_title))
            elif isinstance(chapters, list):
                for c_val in chapters:
                    c_label = f"{c_val.get('ID', '')} {c_val.get('Name', '')}".strip() if isinstance(c_val, dict) else ""
                    flat_sections.extend(find_all_sections_in_container(c_val, c_label, act_id, act_title))

    # Process Top-level Sections
    if not flat_sections:
        top_sections = data.get("Sections", {}) if isinstance(data, dict) else {}
        if top_sections:
            flat_sections.extend(parse_section_dict(top_sections, "", act_id, act_title))

    return flat_sections


def flatten_directory(target_dir: str):
    print(f"\nProcessing directory: {target_dir}")
    if not os.path.exists(target_dir):
        print(f"Warning: Directory does not exist: {target_dir}")
        return

    folder_count = 0
    total_sections = 0

    for folder in sorted(os.listdir(target_dir)):
        folder_path = os.path.join(target_dir, folder)
        if not os.path.isdir(folder_path):
            continue

        raw_json_files = glob.glob(os.path.join(folder_path, "*.json"))
        # Exclude existing flattened json files
        raw_json_files = [f for f in raw_json_files if not f.endswith("_flattened.json")]

        if not raw_json_files:
            continue

        for raw_file in raw_json_files:
            folder_name = os.path.basename(folder_path)
            output_filepath = os.path.join(folder_path, f"{folder_name.lower()}_flattened.json")

            with open(raw_file, "r", encoding="utf-8") as f:
                raw_data = json.load(f)

            act_id = raw_data.get("Act ID", raw_data.get("act_id", folder_name)) if isinstance(raw_data, dict) else folder_name
            act_title = raw_data.get("Act Title", raw_data.get("act_title", folder_name)) if isinstance(raw_data, dict) else folder_name

            sections = parse_legal_json(raw_data, act_id, act_title)

            out_data = {
                "act_id": act_id,
                "act_title": act_title,
                "sections": sections
            }

            with open(output_filepath, "w", encoding="utf-8") as out_f:
                json.dump(out_data, out_f, indent=4)

            print(f"  [+] {folder_name}: {len(sections)} sections saved to {os.path.basename(output_filepath)}")
            folder_count += 1
            total_sections += len(sections)

    print(f"Finished {target_dir}: {folder_count} acts, {total_sections} total sections flattened.")


if __name__ == "__main__":
    print("=========================================")
    print("Project Access - Legal Data Flattener")
    print("=========================================")
    flatten_directory(CRIMINAL_DIR)
    flatten_directory(CIVIL_DIR)
    print("\n[SUCCESS] All criminal and civil laws successfully flattened!")
