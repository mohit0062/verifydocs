const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://verifydocs.online';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') return walk(full);
    return [full];
  });
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function write(rel, html) {
  fs.writeFileSync(path.join(ROOT, rel), html);
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonLd(data) {
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

function stripSchemaType(html, type) {
  return html.replace(/\n?\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, (block) => {
    return block.includes(`"@type": "${type}"`) ? '' : block;
  });
}

function titleFrom(html, fallback) {
  return (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || fallback)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function descriptionFrom(html) {
  return html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || 'VerifyDocs.online answer-friendly guide.';
}

function relToUrl(rel) {
  const clean = rel.replace(/\\/g, '/').replace(/\.html$/, '').replace(/(^|\/)index$/, '$1');
  return `${SITE}/${clean === '' ? '' : clean}`;
}

function cleanAiClaims() {
  const files = [
    'blog/how-to-verify-documents-online.html',
    'blog/online-document-verification.html',
    'blog/online-document-verification-guide.html',
    'blog/detect-fake-documents-online-guide.html',
    'blog/verify-documents-online.html'
  ];

  const replacements = [
    [/VerifyDocs uses advanced AI and forensic analysis to inspect documents deeply\. Our system checks multiple layers of a file, including:[\s\S]*?<h2>How to Verify a Document Online<\/h2>/g, 'VerifyDocs focuses on private browser-based format checks and educational guidance. It does not upload private documents, scan metadata, or perform forensic AI analysis. Use official portals or the issuing authority for final verification.</p>\n\n<h2>How to Verify a Document Online</h2>'],
    [/VerifyDocs uses advanced AI technology to scan and analyze documents at multiple levels\. It checks for editing traces, detects AI-generated patterns, and identifies inconsistencies within the file\./g, 'VerifyDocs focuses on browser-based document-number format checks and educational guidance. It does not upload documents, scan files with AI, or replace official verification from the issuer.'],
    [/Whether it’s a certificate, bank statement, ID proof, or invoice, verifying authenticity is essential before making any decisions\. In this guide, we’ll explore the top ways to detect fake documents and how tools like VerifyDocs can help you verify files instantly\./g, 'Whether it is a certificate, bank statement, ID proof, or invoice, verifying authenticity is essential before making any decisions. In this guide, we explain warning signs, private format checks, and when to use official sources.'],
    [/<strong>Step 1:<\/strong> Upload your document\.<br>/g, '<strong>Step 1:</strong> Check the visible document number or format in your browser.<br>'],
    [/<strong>Step 2:<\/strong> The system scans the file instantly\.<br>/g, '<strong>Step 2:</strong> Review the format, checksum, or structure guidance.<br>'],
    [/<strong>Step 2:<\/strong> Our AI scans and analyzes the file\.<br>/g, '<strong>Step 2:</strong> Review the format, checksum, or structure guidance.<br>'],
    [/<strong>Step 3:<\/strong> The system detects signs of tampering or forgery\.<br>/g, '<strong>Step 3:</strong> Use the relevant official portal or issuer for confirmation.<br>'],
    [/<strong>Step 4:<\/strong> Receive instant results with fraud insights\./g, '<strong>Step 4:</strong> Treat browser checks as a first-pass screen, not legal proof.'],
    [/<strong>Step 4:<\/strong> Get a verification result within seconds\./g, '<strong>Step 4:</strong> Treat format checks as first-pass guidance, not legal proof.'],
    [/VerifyDocs is an online document verification platform that helps users detect fake, forged, edited, or AI-generated documents instantly\./g, 'VerifyDocs is a privacy-first utility site for browser-based document-number format checks and educational guides.'],
    [/Simply upload your file and let our advanced detection system analyze it within seconds\./g, 'Use VerifyDocs for first-pass structural checks, then confirm important documents with official sources.'],
    [/<strong>Step 2:<\/strong> AI scans and analyzes the file\.<br>/g, '<strong>Step 2:</strong> Review format, checksum, and visible structure guidance.<br>'],
    [/Manual verification depends on human observation, which can miss hidden edits\. Online verification tools like VerifyDocs use AI and forensic analysis to detect even the smallest manipulation\./g, 'Manual verification depends on human observation, which can miss hidden edits. VerifyDocs helps with first-pass browser-based format checks, while official issuers or portals should be used for final confirmation.'],
    [/1\. Upload your document\.<br>\s*2\. Our AI scans metadata, fonts, layers, and editing traces\.<br>\s*3\. The system identifies suspicious patterns\.<br>\s*4\. Get instant results and fraud insights\./g, '1. Check the visible document number or format in your browser.<br>\n2. Review format, checksum, and structure guidance.<br>\n3. Compare document details with official issuer expectations.<br>\n4. Use the official portal or issuer for final confirmation.'],
    [/Don’t trust every file you receive\. Protect yourself from fraud with VerifyDocs\. Upload your documents today and detect fake, forged, or AI-generated files instantly\./g, 'Do not trust every file you receive. Use VerifyDocs for private first-pass format checks, then confirm high-risk documents with the official issuer or government portal.'],
    [/AI-powered fraud detection/g, 'browser-based format validation'],
    [/AI-powered detection system/g, 'browser-based format checking'],
    [/Safe and secure uploads/g, 'No sensitive document-number uploads for validators']
  ];

  for (const rel of files) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    let html = fs.readFileSync(full, 'utf8');
    for (const [from, to] of replacements) html = html.replace(from, to);
    fs.writeFileSync(full, html);
  }
}

function addSpeakable() {
  const htmlFiles = walk(ROOT)
    .filter((file) => file.endsWith('.html'))
    .filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`))
    .filter((file) => /[\\/]tools[\\/]|[\\/]blog[\\/]|index\.html$/.test(file))
    .filter((file) => !file.endsWith(`${path.sep}blog${path.sep}admin.html`));

  for (const file of htmlFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    let html = fs.readFileSync(file, 'utf8');
    html = stripSchemaType(html, 'WebPage');
    const title = titleFrom(html, rel);
    const speakable = jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${relToUrl(rel)}#webpage`,
      url: relToUrl(rel),
      name: title,
      description: descriptionFrom(html),
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: [
          'h1',
          'main p:first-of-type',
          '.faq-item:first-of-type span'
        ]
      }
    });
    html = html.replace('</head>', `  ${speakable}\n</head>`);
    fs.writeFileSync(file, html);
  }
}

function addHubFaq(rel, faqs) {
  let html = read(rel);
  if (!html.includes('"@type": "FAQPage"')) {
    const schema = jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a }
      }))
    });
    html = html.replace('</head>', `  ${schema}\n</head>`);
  }

  if (!html.includes('id="answer-faq"')) {
    const section = `
    <section id="answer-faq" class="mt-10 rounded-[8px] border border-border-col bg-white p-6">
      <h2 class="text-2xl font-extrabold text-text-main">Frequently Asked Questions</h2>
      <div class="mt-5 space-y-5">
        ${faqs.map((faq) => `<div><h3 class="text-base font-bold text-text-main">${esc(faq.q)}</h3><p class="mt-2 text-sm leading-relaxed text-text-muted">${esc(faq.a)}</p></div>`).join('\n        ')}
      </div>
    </section>
`;
    html = html.replace('</main>', `${section}</main>`);
  }
  write(rel, html);
}

function addMissingFaqs() {
  addHubFaq('tools/pdf-tools.html', [
    { q: 'What is the PDF command center?', a: 'The PDF command center is a browser-based workspace for common PDF actions such as merging, splitting, compressing, converting, rotating, locking, and organizing PDF files.' },
    { q: 'Are PDF files uploaded to VerifyDocs?', a: 'PDF actions are designed around privacy-first browser processing where supported. Sensitive files should not be sent by email or pasted into unknown tools.' },
    { q: 'Which PDF tools are available?', a: 'The page lists merge, split, compress, PDF to Word, Word to PDF, image conversion, watermark, rotate, lock, unlock, organize, OCR, compare, redact, crop, and related PDF workflows.' },
    { q: 'Is the PDF command center free?', a: 'Yes. VerifyDocs lists PDF workflows as free online utilities with no sign-up required.' },
    { q: 'Can I use PDF tools on mobile?', a: 'Yes. The PDF command center is built with a responsive layout for desktop and mobile browsers.' }
  ]);

  addHubFaq('tools/image-tools.html', [
    { q: 'What are the VerifyDocs image tools?', a: 'The image tools page provides browser-based workflows for converting, resizing, compressing, cropping, rotating, blurring, sharpening, watermarking, and Base64 image tasks.' },
    { q: 'Do image tools work in the browser?', a: 'Yes. Supported image actions run in the browser so common conversions and edits can happen without a complex desktop app.' },
    { q: 'Which image formats are supported?', a: 'The page focuses on common web formats such as JPG, PNG, WEBP, SVG, and Base64 image data.' },
    { q: 'Are the image tools free?', a: 'Yes. The image tools are listed as free utilities on VerifyDocs.online.' },
    { q: 'Can I convert SVG to PNG or JPG?', a: 'Yes. The image tools include an SVG rasterization workflow for creating PNG or JPG output from SVG artwork.' }
  ]);
}

function addBlogHowTo(rel, steps) {
  let html = read(rel);
  if (html.includes('"@type": "HowTo"')) return;
  const title = titleFrom(html, rel);
  const schema = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description: descriptionFrom(html),
    step: steps.map((step) => ({ '@type': 'HowToStep', name: step.name, text: step.text }))
  });
  html = html.replace('</head>', `  ${schema}\n</head>`);
  write(rel, html);
}

function addMissingHowTo() {
  addBlogHowTo('blog/aadhaar-masking-why-important.html', [
    { name: 'Enter Aadhaar number', text: 'Enter the Aadhaar number in the browser-based masking tool.' },
    { name: 'Mask the first eight digits', text: 'Keep only the last four digits visible and hide the first eight digits.' },
    { name: 'Use the masked copy', text: 'Use the masked version when full Aadhaar disclosure is not required.' }
  ]);
  addBlogHowTo('blog/gst-number-structure.html', [
    { name: 'Check the state code', text: 'Confirm that the first two GSTIN digits match a valid Indian GST state code.' },
    { name: 'Check the embedded PAN', text: 'Review positions 3 to 12 as the PAN portion of the GSTIN.' },
    { name: 'Check the final characters', text: 'Confirm the entity number, default Z character, and check digit pattern.' }
  ]);
  addBlogHowTo('blog/why-document-verification-matters-2026.html', [
    { name: 'Run a format check', text: 'Use browser-based validation to catch obvious structural errors.' },
    { name: 'Compare visible details', text: 'Compare document details against the expected issuer format.' },
    { name: 'Confirm officially', text: 'Use official portals or the issuing authority for legal status or identity confirmation.' },
    { name: 'Protect sensitive data', text: 'Avoid sending sensitive document numbers to unknown websites or email addresses.' }
  ]);
}

function questionifyHeadings() {
  const swaps = [
    ['tools/aadhaar-validator.html', 'Aadhaar Number Format Breakdown', 'What is the Aadhaar number format?'],
    ['tools/aadhaar-validator.html', 'Common Errors in Aadhaar Numbers', 'What are common Aadhaar number errors?'],
    ['tools/pan-validator.html', 'PAN Card Format Breakdown', 'What is the PAN card format?'],
    ['tools/gst-validator.html', 'GSTIN Format Breakdown', 'What is the GSTIN format?'],
    ['tools/upi-validator.html', 'UPI ID Format', 'What is the UPI ID format?']
  ];

  for (const [rel, from, to] of swaps) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    let html = fs.readFileSync(full, 'utf8');
    html = html.replaceAll(`>${from}<`, `>${to}<`);
    fs.writeFileSync(full, html);
  }
}

cleanAiClaims();
addSpeakable();
addMissingFaqs();
addMissingHowTo();
questionifyHeadings();
