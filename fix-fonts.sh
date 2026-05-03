#!/usr/bin/env bash
# fix-fonts.sh — Standardise fonts across all VerifyDocs HTML pages
set -euo pipefail

STANDARD_FONT='<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900\&family=JetBrains+Mono:wght@400;600\&display=swap" rel="stylesheet">'
HINDI_FONT='<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900\&family=JetBrains+Mono:wght@400;600\&family=Noto+Sans+Devanagari:wght@400;700\&display=swap" rel="stylesheet">'
TYPO_LINK='  <link rel="stylesheet" href="/assets/site-typography.css">'

PRECONNECT_LINE='  <link rel="preconnect" href="https://fonts.googleapis.com">'
PRECONNECT_GS='  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'

echo "=== VerifyDocs Font Standardisation ==="

# All HTML files except Hindi pages
NON_HINDI=$(find . -name "*.html" ! -path "./hi/*" ! -path "./.git/*")
HINDI=$(find . -path "./hi/*.html" ! -path "./.git/*")

fix_file() {
  local FILE="$1"
  local FONT_LINE="$2"

  # 1. Remove ALL existing Google Fonts link lines (font imports only)
  sed -i '/fonts\.googleapis\.com\/css2/d' "$FILE"

  # 2. Remove old preconnect lines for gstatic (we'll re-add tidy ones)
  sed -i '/fonts\.gstatic\.com/d' "$FILE"

  # 3. Remove old bare preconnect for googleapis if it's on its own line
  sed -i '/rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/d' "$FILE"

  # 4. Remove any existing site-typography.css link to avoid duplicates
  sed -i '/site-typography\.css/d' "$FILE"

  # 5. Insert the standard font block right after <head> or <meta charset>
  #    (find first <meta charset line and insert after it)
  python3 - "$FILE" "$FONT_LINE" "$TYPO_LINK" <<'PYEOF'
import sys, re

path      = sys.argv[1]
font_line = sys.argv[2]
typo_link = sys.argv[3]

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Build the block to insert
block = (
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '  ' + font_line + '\n'
    + typo_link + '\n'
)

# Insert after <meta charset…> line (first occurrence)
content = re.sub(
    r'(<meta\s+charset[^>]*>)',
    r'\1\n' + block.rstrip('\n'),
    content,
    count=1
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'  ✓ {path}')
PYEOF
}

echo ""
echo "── Non-Hindi pages ──"
for f in $NON_HINDI; do
  fix_file "$f" "$STANDARD_FONT"
done

echo ""
echo "── Hindi pages ──"
for f in $HINDI; do
  fix_file "$f" "$HINDI_FONT"
done

echo ""
echo "=== Done. All pages now use Inter + JetBrains Mono ==="
