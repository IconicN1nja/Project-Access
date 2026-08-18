import os

page_path = r"c:\Project-Access\frontend\src\app\page.tsx"

if not os.path.exists(page_path):
    print("page.tsx not found!")
    exit(1)

with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

# Define classes to replace
replacements = {
    "px-container-margin": "px-c-container-margin",
    "py-xl": "py-c-xl",
    "mb-xl": "mb-c-xl",
    "mb-sm": "mb-c-sm",
    "mb-md": "mb-c-md",
    "pb-lg": "pb-c-lg",
    "gap-lg": "gap-c-lg",
    "gap-sm": "gap-c-sm",
    "gap-xs": "gap-c-xs",
    "gap-base": "gap-c-base",
    "gap-md": "gap-c-md",
    "px-md": "px-c-md",
    "py-sm": "py-c-sm",
    "p-md": "p-c-md",
    "p-lg": "p-c-lg",
    "p-sm": "p-c-sm",
    "p-xs": "p-c-xs",
    "px-xs": "px-c-xs",
    "py-xs": "py-c-xs",
    "pb-md": "pb-c-md"
}

# Perform replacement
replaced_count = 0
for old_cls, new_cls in replacements.items():
    # Make sure we don't double replace by using word boundaries or exact string matching
    # We can replace in className="..." or general string values
    count = content.count(old_cls)
    if count > 0:
        content = content.replace(old_cls, new_cls)
        print(f"Replaced '{old_cls}' with '{new_cls}' {count} times.")
        replaced_count += count

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Total replacements: {replaced_count}. page.tsx updated successfully.")
