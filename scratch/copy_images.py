import os
import glob
import shutil

source_dir = r"C:\Users\mohit\.gemini\antigravity\brain\aeae4a4a-135f-4299-805f-38a659d6b065"
dest_dir = r"e:\aadar webside\assets"

files = [
    "docs_3d",
    "pdf_3d",
    "image_3d",
    "dev_3d",
    "design_3d",
    "media_3d",
    "util_3d"
]

for base_name in files:
    # Find the most recently generated file matching the pattern
    pattern = os.path.join(source_dir, f"{base_name}_*.png")
    matches = glob.glob(pattern)
    if matches:
        # Sort by modification time to get the latest
        latest_file = max(matches, key=os.path.getmtime)
        dest_file = os.path.join(dest_dir, f"{base_name}.png")
        shutil.copy2(latest_file, dest_file)
        print(f"Copied {latest_file} -> {dest_file}")
    else:
        print(f"No match found for {base_name}")
