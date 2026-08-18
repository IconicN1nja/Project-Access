import json
import os


def flatten_legal_json(input_filepath, output_filepath, act_id, act_title):
    with open(input_filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    flat_sections = []
    chapters = data.get("Chapters", {})

    # Iterate through the chapters
    for chap_idx, chapter_data in chapters.items():
        chapter_id = chapter_data.get("ID", "")
        chapter_name = chapter_data.get("Name", "")
        chapter_label = f"{chapter_id} {chapter_name}".strip()

        sections = chapter_data.get("Sections", {})
        subheadings = chapter_data.get("Subheadings", [])

        # Recursive function to extract text from nested paragraphs
        def extract_text(p_data):
            text_parts = []
            if isinstance(p_data, str):
                text_parts.append(p_data)
            elif isinstance(p_data, dict):
                if "text" in p_data:
                    text_parts.append(p_data["text"])
                if "contains" in p_data:
                    for k, v in p_data["contains"].items():
                        text_parts.append(extract_text(v))
            return " ".join(text_parts)

        # Helper to process and format section dictionaries
        def process_sections(section_dict):
            for sec_key, sec_val in section_dict.items():
                sec_heading = sec_val.get("heading", "")
                paragraphs = sec_val.get("paragraphs", {})

                full_text = []
                for p_idx, p_data in paragraphs.items():
                    full_text.append(extract_text(p_data))

                combined_text = "\n".join(full_text)

                # Clean up the section number string
                sec_num = sec_key.replace("Section", "").replace(".", "").strip()

                flat_sections.append(
                    {
                        "section_number": sec_num,
                        "section_title": sec_heading,
                        "chapter": chapter_label,
                        "text": f"{sec_key} {sec_heading}\n{combined_text}",
                        "source_label": f"Section {sec_num}, {act_title}",
                        "chunk_id": f"{act_id}_{sec_num}",
                    }
                )

        # Extract sections directly under the chapter
        if sections:
            process_sections(sections)

        # Extract sections nested under subheadings (e.g., in POCSO)
        for sub in subheadings:
            sub_sections = sub.get("Sections", {})
            if sub_sections:
                process_sections(sub_sections)

    # Create the final flat structure
    output_data = {"act_id": act_id, "act_title": act_title, "sections": flat_sections}

    with open(output_filepath, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"Flattened {len(flat_sections)} sections and saved to {output_filepath}")


# Execute the function for POCSO
flatten_legal_json(
    input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pocso/pocso_sections.json",
    output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pocso/pocso_flattened.json",
    act_id="POCSO_2012",
    act_title="The Protection of Children from Sexual Offences Act, 2012",
)

# 1. Arms Act
flatten_legal_json(
    input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/arms/arms_sections.json",
    output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/arms/arms_flattened.json",
    act_id="ARMS_1959",
    act_title="The Arms Act, 1959",
)

# 2. UAPA
flatten_legal_json(
    input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/uapa/uapa_sections.json",
    output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/uapa/uapa_flattened.json",
    act_id="UAPA_1967",
    act_title="The Unlawful Activities (Prevention) Act, 1967",
)

# 3. Domestic Violence Act
flatten_legal_json(
    input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/domestic_violence/domestic_violence_sections.json",
    output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/domestic_violence/domestic_violence_flattened.json",
    act_id="DV_2005",
    act_title="The Protection of Women from Domestic Violence Act, 2005",
)

# 4. NDPS Act
flatten_legal_json(
    input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/ndps/ndps_sections.json",
    output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/ndps/ndps_flattened.json",
    act_id="NDPS_1985",
    act_title="The Narcotic Drugs and Psychotropic Substances Act, 1985",
)

# You can add similar function calls for Arms Act, UAPA, DV Act, and NDPS here
