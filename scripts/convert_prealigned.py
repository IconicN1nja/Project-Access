import json
import os


def convert_prealigned_json(input_filepath, output_filepath, act_id, act_title):
    """
    Converts a pre-flattened list-style sections JSON (e.g. BNS, BSA)
    into the standard {act_id, act_title, sections: [...]} dict format
    expected by the Qdrant indexer.
    """
    with open(input_filepath, "r", encoding="utf-8") as f:
        raw_sections = json.load(f)

    converted_sections = []
    for sec in raw_sections:
        sec_num = str(sec.get("section_number", ""))
        converted_sections.append(
            {
                "section_number": sec_num,
                "section_title": sec.get("section_title", ""),
                "chapter": sec.get("chapter", ""),
                "text": sec.get("text", ""),
                "source_label": f"Section {sec_num}, {act_title}",
                "chunk_id": f"{act_id}_{sec_num}",
            }
        )

    output_data = {"act_id": act_id, "act_title": act_title, "sections": converted_sections}

    with open(output_filepath, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"Converted {len(converted_sections)} sections and saved to {output_filepath}")


# 13. BNS
convert_prealigned_json(
    input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/bns/bns_sections.json",
    output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/bns/bns_flattened.json",
    act_id="BNS_2023",
    act_title="Bharatiya Nyaya Sanhita, 2023",
)

# 14. BSA
convert_prealigned_json(
    input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/bsa/bsa_sections.json",
    output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/bsa/bsa_flattened.json",
    act_id="BSA_2023",
    act_title="Bharatiya Sakshya Adhiniyam, 2023",
)
