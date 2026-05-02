import os
import re

tools_dir = r"e:\aadar webside\tools"

files_with_duplicates = [
    "audio-compressor.html",
    "barcode-generator.html",
    "base64-encode-decode.html",
    "color-picker.html",
    "css-minifier.html",
    "gif-maker.html",
    "html-minifier.html",
    "image-to-gif.html",
    "json-formatter.html",
    "md5-sha-generator.html",
    "password-generator.html",
    "qr-code-generator.html",
    "remove-duplicate-lines.html",
    "svg-to-jpg.html",
    "svg-to-png.html",
    "unit-converter.html",
    "upi-validator.html",
    "url-encoder-decoder.html",
    "video-compressor.html",
    "video-to-mp3.html",
    "xml-formatter.html",
]

# This pattern matches a full <section> block containing "Frequently Asked Questions"
# We'll find ALL such sections and keep only the LAST one (most complete 10-item version)
SECTION_PATTERN = re.compile(
    r'(<section[^>]*class="[^"]*panel[^"]*"[^>]*>\s*(?:<h2[^>]*>(?:How to use[^<]*|Frequently Asked Questions[^<]*)<\/h2>|.*?Frequently Asked Questions.*?<\/h2>)\s*<div class="space-y-4">.*?<\/div>\s*<\/section>)',
    re.DOTALL
)

# Simpler approach: find all FAQ sections by splitting on the marker
FAQ_HEADER = '<h2 class="text-2xl font-bold text-text-main mb-8 text-center">Frequently Asked Questions'

results = []

for filename in files_with_duplicates:
    filepath = os.path.join(tools_dir, filename)
    if not os.path.exists(filepath):
        results.append(f"SKIP (not found): {filename}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count occurrences
    count = content.count('Frequently Asked Questions')
    if count < 2:
        results.append(f"OK (only {count} FAQ): {filename}")
        continue
    
    # Find position of first and second FAQ heading
    idx1 = content.find('Frequently Asked Questions')
    idx2 = content.find('Frequently Asked Questions', idx1 + 1)
    
    if idx2 == -1:
        results.append(f"OK (only 1 FAQ): {filename}")
        continue

    # Walk backwards from idx1 to find start of the <section> tag
    # The section starts before the h2
    section_start = content.rfind('<section', 0, idx1)
    
    if section_start == -1:
        results.append(f"MANUAL (no <section> before first FAQ): {filename}")
        continue
    
    # Walk forwards from idx1 to find the </section> that CLOSES this section
    # We need to find the matching </section> - count nesting
    search_from = idx1
    depth = 1
    pos = section_start + 1
    close_pos = -1
    
    # Find the opening section first occurrence after section_start
    temp = content[section_start:]
    
    # Simple approach: find </section> after the first FAQ heading
    # But make sure we don't grab the second FAQ block's section
    # Find the </section> that comes between idx1 and idx2
    close_tag = '</section>'
    close_pos = content.find(close_tag, idx1)
    
    if close_pos == -1 or close_pos > idx2:
        results.append(f"MANUAL (can't isolate first section): {filename}")
        continue
    
    # The block to remove is from section_start to close_pos + len(close_tag)
    block_to_remove = content[section_start : close_pos + len(close_tag)]
    
    # Verify the second FAQ is not inside this block
    if 'Frequently Asked Questions' in block_to_remove and content.count('Frequently Asked Questions', section_start, close_pos + len(close_tag)) > 1:
        results.append(f"MANUAL (both FAQs in same block): {filename}")
        continue
    
    # Remove the first FAQ block + any trailing whitespace/newline
    new_content = content[:section_start].rstrip('\r\n') + '\n' + content[close_pos + len(close_tag):].lstrip('\r\n')
    
    # Verify fix
    remaining = new_content.count('Frequently Asked Questions')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    results.append(f"FIXED ({count} -> {remaining} FAQs): {filename}")

print("\n".join(results))
