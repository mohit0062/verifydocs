import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all section classes
matches = re.findall(r'<section[^>]*class=["\']([^"\']+)["\'][^>]*>', content)
print("Section Classes:", matches)

# Find footer
footer = re.search(r'(<footer.*?>)', content, re.IGNORECASE | re.DOTALL)
if footer:
    print("Found footer tag")
else:
    print("No footer tag found")
