import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all section IDs
matches = re.findall(r'<section[^>]*id=["\']([^"\']+)["\'][^>]*>', content)
print("Section IDs:", matches)

# Also check if <!-- 3D Category Tabbing Section --> exists
if '<!-- 3D Category Tabbing Section -->' in content:
    print("Found category tabbing section comment!")
else:
    print("Could not find category tabbing section comment.")
    
# Find anything that looks like <!-- ... Category ... -->
comments = re.findall(r'<!--[^>]*Category[^>]*-->', content, re.IGNORECASE)
print("Category comments:", comments)
