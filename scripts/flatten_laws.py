import json
import os


def flatten_legal_json(input_filepath, output_filepath, act_id, act_title):
    with open(input_filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    flat_sections = []
    chapters = data.get("Chapters", {})
    top_level_sections = data.get("Sections", {})

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
    def process_sections(section_dict, chapter_label=""):
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

    # 1. Iterate through the chapters if present
    if chapters:
        for chap_idx, chapter_data in chapters.items():
            chapter_id = chapter_data.get("ID", "")
            chapter_name = chapter_data.get("Name", "")
            chapter_label = f"{chapter_id} {chapter_name}".strip()

            sections = chapter_data.get("Sections", {})
            subheadings = chapter_data.get("Subheadings", [])

            # Extract sections directly under the chapter
            if sections:
                process_sections(sections, chapter_label)

            # Extract sections nested under subheadings (e.g., in POCSO)
            for sub in subheadings:
                sub_sections = sub.get("Sections", {})
                if sub_sections:
                    process_sections(sub_sections, chapter_label)

    # 2. Extract top-level sections for acts without chapters (e.g., IRWA, DPA)
    elif top_level_sections:
        process_sections(top_level_sections, "")

    # Create the final flat structure
    output_data = {"act_id": act_id, "act_title": act_title, "sections": flat_sections}

    with open(output_filepath, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"Flattened {len(flat_sections)} sections and saved to {output_filepath}")


# # 1. Arms Act
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/arms/arms_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/arms/arms_flattened.json",
#     act_id="ARMS_1959",
#     act_title="The Arms Act, 1959",
# )

# # 2. UAPA
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/uapa/uapa_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/uapa/uapa_flattened.json",
#     act_id="UAPA_1967",
#     act_title="The Unlawful Activities (Prevention) Act, 1967",
# )

# # 3. Domestic Violence Act
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/domestic_violence/domestic_violence_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/domestic_violence/domestic_violence_flattened.json",
#     act_id="DV_2005",
#     act_title="The Protection of Women from Domestic Violence Act, 2005",
# )

# # 4. NDPS Act
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/ndps/ndps_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/ndps/ndps_flattened.json",
#     act_id="NDPS_1985",
#     act_title="The Narcotic Drugs and Psychotropic Substances Act, 1985",
# )

# # 5. POCSO Act
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pocso/pocso_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pocso/pocso_flattened.json",
#     act_id="POCSO_2012",
#     act_title="The Protection of Children from Sexual Offences Act, 2012",
# )

# # 7. PMLA
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pmla/pmla_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pmla/pmla_flattened.json",
#     act_id="PMLA_2002",
#     act_title="The Prevention of Money-Laundering Act, 2002",
# )

# # 8. PCA
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pca/pca_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/pca/pca_flattened.json",
#     act_id="PCA_1988",
#     act_title="The Prevention of Corruption Act, 1988",
# )

# # 9. DCA
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/dca/dca_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/dca/dca_flattened.json",
#     act_id="DCA_1940",
#     act_title="The Drugs and Cosmetics Act, 1940",
# )

# # 10. IRWA
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/irwa/irwa_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/irwa/irwa_flattened.json",
#     act_id="IRWA_1986",
#     act_title="The Indecent Representation of Women (Prohibition) Act, 1986",
# )

# # 11. DPA
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/dpa/dpa_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/dpa/dpa_flattened.json",
#     act_id="DPA_1961",
#     act_title="The Dowry Prohibition Act, 1961",
# )

# # 12. SC/ST Act
# flatten_legal_json(
#     input_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/sc_st/sc_st_sections.json",
#     output_filepath="/home/adarsh/Code/Projects/Project-Access/data/criminal/sc_st/sc_st_flattened.json",
#     act_id="SC_ST_1989",
#     act_title="The Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act, 1989",
# )

# Civil Laws 

BASE = "/home/adarsh/Code/Projects/Project-Access/data/civil"

# # 1. Code of Civil Procedure
# flatten_legal_json(
#     input_filepath=f"{BASE}/CPC/CPC.json",
#     output_filepath=f"{BASE}/CPC/CPC_flattened.json",
#     act_id="CPC_1908",
#     act_title="The Code of Civil Procedure, 1908",
# )
#
# # 2. Indian Contract Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/ICA/ICA.json",
#     output_filepath=f"{BASE}/ICA/ICA_flattened.json",
#     act_id="ICA_1872",
#     act_title="The Indian Contract Act, 1872",
# )
#
# # 3. Indian Partnership Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/IPA/IPA.json",
#     output_filepath=f"{BASE}/IPA/IPA_flattened.json",
#     act_id="IPA_1932",
#     act_title="The Indian Partnership Act, 1932",
# )
#
# # 4. Sale of Goods Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/SOGA/SOGA.json",
#     output_filepath=f"{BASE}/SOGA/SOGA_flattened.json",
#     act_id="SOGA_1930",
#     act_title="The Sale of Goods Act, 1930",
# )
#
# # 5. Arbitration and Conciliation Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/ACA/ACA.json",
#     output_filepath=f"{BASE}/ACA/ACA_flattened.json",
#     act_id="ACA_1996",
#     act_title="The Arbitration and Conciliation Act, 1996",
# )
#
# # 6. Transfer of Property Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/TPA/TPA.json",
#     output_filepath=f"{BASE}/TPA/TPA_flattened.json",
#     act_id="TPA_1882",
#     act_title="The Transfer of Property Act, 1882",
# )
#
# # 7. Prohibition of Benami Property Transactions Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/PBPT/PBPT.json",
#     output_filepath=f"{BASE}/PBPT/PBPT_flattened.json",
#     act_id="PBPT_1988",
#     act_title="The Prohibition of Benami Property Transactions Act, 1988",
# )
#
# # 8. Hindu Marriage Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/HMA/HMA.json",
#     output_filepath=f"{BASE}/HMA/HMA_flattened.json",
#     act_id="HMA_1955",
#     act_title="The Hindu Marriage Act, 1955",
# )
#
# # 9. Hindu Succession Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/HSA/HSA.json",
#     output_filepath=f"{BASE}/HSA/HSA_flattened.json",
#     act_id="HSA_1956",
#     act_title="The Hindu Succession Act, 1956",
# )
#
# # 10. Hindu Adoptions and Maintenance Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/HAMA/HAMA.json",
#     output_filepath=f"{BASE}/HAMA/HAMA_flattened.json",
#     act_id="HAMA_1956",
#     act_title="The Hindu Adoptions and Maintenance Act, 1956",
# )
#
# # 11. Special Marriage Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/SMA/SMA.json",
#     output_filepath=f"{BASE}/SMA/SMA_flattened.json",
#     act_id="SMA_1954",
#     act_title="The Special Marriage Act, 1954",
# )
#
# # 12. Specific Relief Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/SRA/SRA.json",
#     output_filepath=f"{BASE}/SRA/SRA_flattened.json",
#     act_id="SRA_1963",
#     act_title="The Specific Relief Act, 1963",
# )
#
# # 13. Consumer Protection Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/CPA/CPA.json",
#     output_filepath=f"{BASE}/CPA/CPA_flattened.json",
#     act_id="CPA_2019",
#     act_title="The Consumer Protection Act, 2019",
# )
#
# # 14. Debt Recovery Tribunal Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/DRT/DRT.json",
#     output_filepath=f"{BASE}/DRT/DRT_flattened.json",
#     act_id="DRT_1993",
#     act_title="The Recovery of Debts Due to Banks and Financial Institutions Act, 1993",
# )
#
# # 15. Companies Act (NCLT)
# flatten_legal_json(
#     input_filepath=f"{BASE}/CA2013/CA2013.json",
#     output_filepath=f"{BASE}/CA2013/CA2013_flattened.json",
#     act_id="CA_2013",
#     act_title="The Companies Act, 2013",
# )
#
# # 16. Insolvency and Bankruptcy Code
# flatten_legal_json(
#     input_filepath=f"{BASE}/IBC/IBC.json",
#     output_filepath=f"{BASE}/IBC/IBC_flattened.json",
#     act_id="IBC_2016",
#     act_title="The Insolvency and Bankruptcy Code, 2016",
# )
#
# # 17. SARFAESI Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/SARFAESI/SARFAESI.json",
#     output_filepath=f"{BASE}/SARFAESI/SARFAESI_flattened.json",
#     act_id="SARFAESI_2002",
#     act_title="The Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002",
# )
#
# # 18. Motor Vehicles Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/MVA/MVA.json",
#     output_filepath=f"{BASE}/MVA/MVA_flattened.json",
#     act_id="MVA_1988",
#     act_title="The Motor Vehicles Act, 1988",
# )
# # 19. Legal Services Authorities Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/LSAA/LSAA.json",
#     output_filepath=f"{BASE}/LSAA/LSAA_flattened.json",
#     act_id="LSAA_1987",
#     act_title="The Legal Services Authorities Act, 1987",
# )
# # 20. Income Tax Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/ITA/ITA.json",
#     output_filepath=f"{BASE}/ITA/ITA_flattened.json",
#     act_id="ITA_1961",
#     act_title="The Income-Tax Act, 1961",
# )
# # 21. CGST Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/CGST/CGST.json",
#     output_filepath=f"{BASE}/CGST/CGST_flattened.json",
#     act_id="CGST_2017",
#     act_title="The Central Goods and Services Tax Act, 2017",
# )
# # 22. Customs Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/CA1962/CA1962.json",
#     output_filepath=f"{BASE}/CA1962/CA1962_flattened.json",
#     act_id="CUSTOMS_1962",
#     act_title="The Customs Act, 1962",
# )
# # 23. Code on Wages Act
# flatten_legal_json(
#     input_filepath=f"{BASE}/COW/COW.json",
#     output_filepath=f"{BASE}/COW/COW_flattened.json",
#     act_id="CODE_ON_WAGES_2019",
#     act_title="The Code on Wages, 2019",
# )
#
# 24. Mediation Act
flatten_legal_json(
    input_filepath=f"{BASE}/MA/MA.json",
    output_filepath=f"{BASE}/MA/MA_flattened.json",
    act_id="MEDIATION_ACT_2023",
    act_title="The Mediation Act, 2023",
)
