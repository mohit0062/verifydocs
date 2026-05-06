import os
import glob

html_files = [
    'tools/document-tools.html',
    'tools/design-tools.html',
    'tools/developer-tools.html',
    'tools/media-tools.html',
    'tools/utility-tools.html',
    'tools/pdf-tools.html',
    'tools/image-tools.html'
]

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace relative links with absolute root-relative links
    # Home link
    content = content.replace('href="../"', 'href="/"')
    content = content.replace('href="./"', 'href="/"') # Just in case
    
    # Blog link
    content = content.replace('href="../blog/"', 'href="/blog/"')
    content = content.replace('href="./blog/"', 'href="/blog/"')
    
    # About link
    content = content.replace('href="../about"', 'href="/about"')
    content = content.replace('href="./about"', 'href="/about"')
    
    # Contact link
    content = content.replace('href="../contact"', 'href="/contact"')
    content = content.replace('href="./contact"', 'href="/contact"')
    
    # Hindi link
    content = content.replace('href="../hi/"', 'href="/hi/"')
    content = content.replace('href="./hi/"', 'href="/hi/"')
    
    # Manifest
    content = content.replace('href="../manifest.json"', 'href="/manifest.json"')
    content = content.replace('href="./manifest.json"', 'href="/manifest.json"')
    
    # Let's also fix the dropdown tool links to be absolute root-relative to avoid any issues
    # They start with href="./" inside the tools directory
    tool_list = [
        "aadhaar-validator", "aadhaar-masking-tool", "pan-validator", "gst-validator",
        "voter-id-validator", "ifsc-validator", "passport-validator", "driving-license-validator",
        "upi-validator", "vehicle-validator", "lic-validator", "pdf-tools", "image-tools",
        "background-remover", "image-upscaler"
    ]
    for tool in tool_list:
        content = content.replace(f'href="./{tool}"', f'href="/tools/{tool}"')
        content = content.replace(f'href="../tools/{tool}"', f'href="/tools/{tool}"')
        
    # Same for bento grid links if they exist
    bento_tools = ["document-tools", "design-tools", "developer-tools", "media-tools", "utility-tools"]
    for tool in bento_tools:
        content = content.replace(f'href="./{tool}"', f'href="/tools/{tool}"')
        content = content.replace(f'href="../tools/{tool}"', f'href="/tools/{tool}"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed links in {filepath}")

# Let's also check index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('href="./blog/"', 'href="/blog/"')
content = content.replace('href="./about"', 'href="/about"')
content = content.replace('href="./contact"', 'href="/contact"')
content = content.replace('href="./hi/"', 'href="/hi/"')
content = content.replace('href="./manifest.json"', 'href="/manifest.json"')
content = content.replace('href="./"', 'href="/"')

# Fix tools links in index.html
for tool in tool_list + bento_tools:
    content = content.replace(f'href="./tools/{tool}"', f'href="/tools/{tool}"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed links in index.html")
