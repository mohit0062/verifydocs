import os
import re

tools_dir = r"e:\aadar webside\tools"

# Files confirmed to have duplicate FAQ sections
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

# Pattern to match the OLD short FAQ block (2-item version)
# These are the old style with font-black and simple div/h3/p structure
OLD_FAQ_PATTERN = re.compile(
    r'<section class="panel mt-6 p-5 md:p-7">\s*'
    r'<h2 class="text-2xl font-black">(?:FAQ|Frequently Asked Questions|How to use[^"]*)"?\s*</h2>\s*'
    r'<div class="mt-4 space-y-4 text-sm leading-relaxed text-text-muted">.*?</div>\s*'
    r'</section>',
    re.DOTALL
)

# Alternate pattern for old FAQ with font-black heading
OLD_FAQ_PATTERN2 = re.compile(
    r'<section class="panel mt-6 p-5 md:p-7">\s*'
    r'<h2 class="[^"]*font-black[^"]*">(?:FAQ|Frequently Asked Questions)[^<]*</h2>\s*'
    r'<div class="mt-4 space-y-4 text-sm leading-relaxed text-text-muted">.*?</div>\s*'
    r'</section>',
    re.DOTALL
)

results = []

for filename in files_with_duplicates:
    filepath = os.path.join(tools_dir, filename)
    if not os.path.exists(filepath):
        results.append(f"SKIP (not found): {filename}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Count how many FAQ sections exist
    faq_count = len(re.findall(r'Frequently Asked Questions', content))
    
    if faq_count < 2:
        results.append(f"SKIP (only {faq_count} FAQ found): {filename}")
        continue
    
    # Try to remove the OLD short FAQ block (font-black style)
    new_content, count1 = OLD_FAQ_PATTERN.subn('', content, count=1)
    if count1 == 0:
        new_content, count1 = OLD_FAQ_PATTERN2.subn('', content, count=1)
    
    if count1 > 0:
        # Verify the fix worked
        remaining = len(re.findall(r'Frequently Asked Questions', new_content))
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        results.append(f"FIXED ({faq_count} -> {remaining} FAQs): {filename}")
    else:
        results.append(f"MANUAL REVIEW NEEDED: {filename}")

print("\n".join(results))
