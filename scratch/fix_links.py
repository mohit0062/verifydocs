import os

files_to_fix = [
    'tools/document-tools.html',
    'tools/design-tools.html',
    'tools/developer-tools.html',
    'tools/utility-tools.html',
    'tools/media-tools.html'
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix nav links back to root
        content = content.replace('href="./"', 'href="../"')
        content = content.replace('href="./blog/"', 'href="../blog/"')
        content = content.replace('href="./about"', 'href="../about"')
        content = content.replace('href="./contact"', 'href="../contact"')
        content = content.replace('href="./hi/"', 'href="../hi/"')
        
        # Actually wait, in index.html there's also href="./manifest.json"
        content = content.replace('href="./manifest.json"', 'href="../manifest.json"')
        
        # Also fix any other href="./tools/..." that were missed. 
        # But wait, in create_bento.py, I did content.replace('href="./tools/', 'href="./')
        # So tools inside /tools are correctly prefixed with ./
        # Let's double check if there are any remaining issues.
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed links in {filepath}")
