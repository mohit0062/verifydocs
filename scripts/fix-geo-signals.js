const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://verifydocs.online';
const AUTHOR_NAME = 'Mohit Kumar';
const AUTHOR_ID = `${SITE}/about#mohit-kumar`;
const ORG_ID = `${SITE}/#organization`;
const UPDATED = '2026-05-02';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function write(rel, value) {
  fs.writeFileSync(path.join(ROOT, rel), value);
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonLd(data) {
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

function stripJsonLd(html) {
  return html.replace(/\n?\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
}

function insertAfterDescription(html, block) {
  return html.replace(/(<meta\s+name=["']description["'][^>]*>)/i, `$1\n  ${block}`);
}

function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': AUTHOR_ID,
    name: AUTHOR_NAME,
    url: `${SITE}/about`,
    email: 'support@verifydocs.online',
    jobTitle: 'Creator and maintainer of VerifyDocs.online',
    nationality: { '@type': 'Country', name: 'India' },
    worksFor: { '@id': ORG_ID },
    knowsAbout: [
      'Indian document formats',
      'browser-based validation',
      'Aadhaar Verhoeff checksum',
      'PAN format',
      'GSTIN structure',
      'digital privacy'
    ]
  };
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'VerifyDocs.online',
    alternateName: 'VerifyDocs',
    url: SITE,
    logo: `${SITE}/assets/icon.svg`,
    email: 'support@verifydocs.online',
    description: 'Privacy-first browser-based Indian document validation, PDF, image, media, and utility tools.',
    founder: { '@id': AUTHOR_ID },
    foundingDate: '2026',
    address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@verifydocs.online',
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi']
    },
    sameAs: [
      'https://twitter.com/verifydocs',
      'https://instagram.com/verifydocs'
    ]
  };
}

function claimReviewSchema(url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    url,
    claimReviewed: 'VerifyDocs.online document-number validators run in the browser, do not upload sensitive document numbers, and are not official government verification services.',
    author: { '@id': AUTHOR_ID },
    publisher: { '@id': ORG_ID },
    datePublished: UPDATED,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: 5,
      bestRating: 5,
      worstRating: 1,
      alternateName: 'Accurate'
    },
    itemReviewed: {
      '@type': 'Claim',
      appearance: { '@type': 'WebPage', url },
      author: { '@id': ORG_ID },
      datePublished: UPDATED
    }
  };
}

function fixHomepage() {
  let html = read('index.html');
  html = html.replace(/<script type="application\/ld\+json">\s*\{[\s\S]*?"@type": "Organization"[\s\S]*?<\/script>\s*<script type="application\/ld\+json">\s*\{[\s\S]*?"@type": "WebSite"[\s\S]*?<\/script>/, [
    jsonLd(organizationSchema()),
    jsonLd(personSchema()),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: 'VerifyDocs.online',
      url: SITE,
      inLanguage: 'en-IN',
      publisher: { '@id': ORG_ID }
    }),
    jsonLd(claimReviewSchema(SITE))
  ].join('\n  '));
  write('index.html', html);
}

function fixAbout() {
  let html = stripJsonLd(read('about.html'));
  html = html
    .replace('<title>About Us | verifydocs.online â€” Our Mission for Privacy</title>', '<title>About VerifyDocs.online and Mohit Kumar — Privacy-First Document Tools</title>')
    .replace(/<title>About Us \| verifydocs\.online — About VerifyDocs\.online for Privacy<\/title>/, '<title>About VerifyDocs.online and Mohit Kumar - Privacy-First Document Tools</title>')
    .replace('Learn why we built verifydocs.online. Our mission is to provide secure, browser-based Indian document validation tools without compromising your privacy.', 'Learn about VerifyDocs.online, a privacy-first Indian utility project created by Mohit Kumar for browser-based document format validation.')
    .replace('Our Mission', 'About VerifyDocs.online')
    .replace('Secure validation tools for Indian citizens, built with a "Privacy First" mindset.', 'Privacy-first Indian document validation tools created and maintained by Mohit Kumar.')
    .replace('As a creator from India, I was concerned about how much sensitive data is being collected by third-party tools.', `As a creator from India, <strong>${AUTHOR_NAME}</strong> was concerned about how much sensitive data is being collected by third-party tools.`)
    .replace(/<section>\s*<h2 class="text-2xl font-bold text-slate-900 mb-4">Who is behind this\?<\/h2>[\s\S]*?(?=\s*<\/div>\s*<\/footer>)/i, `<section id="mohit-kumar">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Who is behind this?</h2>
      <p>VerifyDocs.online is an independent project created and maintained by <strong>${AUTHOR_NAME}</strong>, a developer from India focused on practical utility tools, document-format education, and digital privacy. The project is intentionally small: it publishes browser-based validators, explanatory guides, and privacy-first utilities rather than collecting sensitive document data.</p>
      <p class="mt-4">For feedback, corrections, and bug reports, contact <a href="mailto:support@verifydocs.online" class="text-blue-600 font-semibold underline">support@verifydocs.online</a>. Please do not send Aadhaar, PAN, voter ID, passport, banking, or other sensitive document numbers by email.</p>
    </section>

    <section>
      <h2 class="text-2xl font-bold text-slate-900 mb-4">What VerifyDocs does and does not do</h2>
      <p>VerifyDocs checks document-number formats, checksum rules, and visible structural patterns in your browser. It does <strong>not</strong> query UIDAI, Income Tax, GSTN, ECI, NPCI, Parivahan, or any other official government database, and it does not confirm a person's identity or legal document status.</p>
      <p class="mt-4">For official records, use the relevant official portals: <a href="https://myaadhaar.uidai.gov.in/" rel="nofollow noopener" class="text-blue-600 font-semibold underline">UIDAI myAadhaar</a>, <a href="https://www.incometax.gov.in/" rel="nofollow noopener" class="text-blue-600 font-semibold underline">Income Tax e-Filing</a>, <a href="https://www.gst.gov.in/" rel="nofollow noopener" class="text-blue-600 font-semibold underline">GST Portal</a>, <a href="https://voters.eci.gov.in/" rel="nofollow noopener" class="text-blue-600 font-semibold underline">Voters' Service Portal</a>, <a href="https://www.npci.org.in/what-we-do/upi/product-overview/" rel="nofollow noopener" class="text-blue-600 font-semibold underline">NPCI UPI</a>, and <a href="https://parivahan.gov.in/" rel="nofollow noopener" class="text-blue-600 font-semibold underline">Parivahan Sewa</a>.</p>
    </section>`);

  html = insertAfterDescription(html, [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About VerifyDocs.online',
      url: `${SITE}/about`,
      description: 'Learn about VerifyDocs.online, a privacy-first Indian utility project created by Mohit Kumar for browser-based document format validation.',
      author: { '@id': AUTHOR_ID },
      publisher: { '@id': ORG_ID },
      mainEntity: { '@id': AUTHOR_ID },
      isPartOf: { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'VerifyDocs.online', url: SITE }
    }),
    jsonLd(organizationSchema()),
    jsonLd(personSchema()),
    jsonLd(claimReviewSchema(`${SITE}/about`)),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'About VerifyDocs.online', item: `${SITE}/about` }
      ]
    })
  ].join('\n  '));

  write('about.html', html);
}

function fixContradictionPost() {
  let html = read('blog/why-document-verification-matters-2026.html');
  const title = 'Why Document Verification Matters in 2026: Fake Document Risks and Format Checks | verifydocs.online';
  const desc = 'Learn why document verification matters in 2026, how fake files are created, and how VerifyDocs helps with private browser-based format checks.';
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/Why Document Verification Matters in 2026: Protect Yourself from Fake &amp; AI-Generated Documents/g, 'Why Document Verification Matters in 2026: Fake Document Risks and Format Checks')
    .replace(/Discover why document verification is essential in 2026\. Learn how to detect fake, forged, edited, and AI-generated documents online with VerifyDocs\./g, desc)
    .replace(/Detect Fake, Forged, or AI-Generated Files Instantly/g, 'Understand Fake, Forged, and AI-Generated File Risks');

  const body = `<div class="prose text-text-muted text-sm mb-12">
    <p>In 2026, digital fraud is evolving quickly. Advanced editing tools and AI generators can make certificates, invoices, screenshots, bank statements, and identity-document images look convincing at first glance. That makes document verification important for individuals, HR teams, lenders, sellers, and small businesses.</p>

    <p>VerifyDocs.online approaches this problem from a privacy-first angle. The current VerifyDocs tools focus on <strong>browser-based format and checksum validation</strong> for document numbers such as Aadhaar, PAN, GSTIN, UPI IDs, voter ID numbers, driving licence formats, and vehicle registration patterns. They do not upload files, scan private documents, or query government databases.</p>

    <h2>The Rise of Fake and AI-Generated Documents</h2>

    <p>Modern fake documents may be created with PDF editors, image editors, template kits, or AI tools. Visual inspection alone can miss manipulated text, inconsistent fonts, copied seals, edited screenshots, or fabricated invoices.</p>

    <p>Common risk areas include fake educational certificates, edited salary slips, forged bank statements, manipulated invoices, fake Aadhaar or PAN images, altered utility bills, and screenshots of transactions.</p>

    <h2>What Format Validation Can Catch</h2>

    <p>Format validation is not the same as official verification, but it is a useful first-pass check. It can catch impossible lengths, invalid character positions, checksum failures, wrong state codes, malformed UPI handles, and common typing mistakes before a user submits data into a form.</p>

    <p>For example, Aadhaar numbers use a Verhoeff checksum, PAN has a fixed 10-character structure with a holder-type character, and GSTIN includes state code, PAN, entity number, default Z character, and a check digit. These are exactly the kinds of structural checks that VerifyDocs explains and validates locally in the browser.</p>

    <h2>What VerifyDocs Does Not Claim</h2>

    <p>VerifyDocs does <strong>not</strong> claim to confirm whether a document is legally genuine, whether a number belongs to a person, whether a taxpayer is active, or whether an uploaded file has been forensically analyzed. The tools do not perform AI fraud detection, metadata analysis, file-structure forensics, or official database lookup.</p>

    <p>For official confirmation, always use the relevant authority: UIDAI for Aadhaar, the Income Tax Department for PAN, GSTN/GST Portal for GSTIN, ECI for voter records, NPCI/banking apps for UPI, and Parivahan for driving licence or vehicle records.</p>

    <h2>A Practical Verification Workflow</h2>

    <p><strong>Step 1:</strong> Use format validation to catch obvious structural errors.<br>
<strong>Step 2:</strong> Compare visible document details against the issuer's expected format.<br>
<strong>Step 3:</strong> Use official portals for legal status or identity confirmation.<br>
<strong>Step 4:</strong> Avoid sending sensitive document numbers to unknown websites or email addresses.</p>

    <h2>Why Privacy-First Checks Matter</h2>

    <p>Many verification tasks start with simple data-entry hygiene. If a tool can catch a typo without uploading the value to a server, that is better for user privacy. This is the core VerifyDocs position: validate what can be validated locally, explain the limits clearly, and direct users to official sources for authority-backed verification.</p>

    <h2>Final Thoughts</h2>

    <p>Fake and AI-generated documents are a real risk, but tools should be honest about what they can verify. VerifyDocs helps with private, browser-based format checks and educational guides. It should be used as a first-pass utility, not as a replacement for official government or issuer verification.</p>
  </div>`;
  html = html.replace(/<div class="prose text-text-muted text-sm mb-12">[\s\S]*?<\/div>\s*(?=<div class="mt-16 pt-10 border-t border-border-col">)/, `${body}\n\n  `);

  html = html.replace(/"dateModified": "[^"]+"/, `"dateModified": "${UPDATED}"`);
  write('blog/why-document-verification-matters-2026.html', html);
}

function fixBlogIndex() {
  let html = read('blog/index.html');
  html = html
    .replace('Detect Fake, Forged & AI-Generated Files Instantly', 'Understand Fake, Forged & AI-Generated File Risks')
    .replace('VerifyDocs helps you detect fake, forged, edited, or AI-generated documents instantly. Upload PDFs, images, and certificates for fast online verification and fraud detection.', 'Learn how to think about fake, forged, edited, or AI-generated documents, and where browser-based format checks fit before official verification.')
    .replace('Discover why document verification is essential in 2026. Learn how to detect fake, forged, edited, and AI-generated documents online with VerifyDocs.', 'Learn why document verification matters in 2026, how fake files are created, and how VerifyDocs helps with private browser-based format checks.')
    .replace('Online Document Verification: Detect Fake, Edited & AI-Generated Files Instantly', 'Online Document Verification: Format Checks, Official Sources, and Privacy')
    .replace('Learn how to verify documents online and detect fake, forged, edited, or AI-generated files instantly using VerifyDocs. Fast, secure, and AI-powered.', 'Learn how to verify document formats online, when to use official sources, and why privacy-first browser checks matter.');

  if (!html.includes('id="static-blog-links"')) {
    html = html.replace('<div id="posts-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">', `<noscript>
    <section id="static-blog-links" class="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <a class="block rounded-xl border border-border-col bg-white p-5 text-text-main no-underline" href="/blog/why-document-verification-matters-2026"><strong>Why Document Verification Matters in 2026</strong><span class="block mt-2 text-sm text-text-muted">Fake document risks, private format checks, and official verification limits.</span></a>
      <a class="block rounded-xl border border-border-col bg-white p-5 text-text-main no-underline" href="/blog/how-to-validate-aadhaar"><strong>How to Validate Aadhaar Online</strong><span class="block mt-2 text-sm text-text-muted">Understand Aadhaar format validation and the Verhoeff checksum.</span></a>
      <a class="block rounded-xl border border-border-col bg-white p-5 text-text-main no-underline" href="/blog/pan-card-format-explained"><strong>PAN Card Format Explained</strong><span class="block mt-2 text-sm text-text-muted">Decode the 10-character PAN structure and holder-type character.</span></a>
      <a class="block rounded-xl border border-border-col bg-white p-5 text-text-main no-underline" href="/blog/gst-number-structure"><strong>GST Number Structure Decoded</strong><span class="block mt-2 text-sm text-text-muted">Learn GSTIN state code, PAN, entity number, and check digit structure.</span></a>
    </section>
  </noscript>

  <div id="posts-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">`);
  }
  write('blog/index.html', html);
}

function addOfficialLinks() {
  const replacements = [
    ['tools/aadhaar-validator.html', "UIDAI's official portal", '<a href="https://myaadhaar.uidai.gov.in/" rel="nofollow noopener" class="underline font-semibold">UIDAI official portal</a>'],
    ['tools/pan-validator.html', 'official Income Tax e-filing portal', '<a href="https://www.incometax.gov.in/" rel="nofollow noopener" class="underline font-semibold">official Income Tax e-Filing portal</a>'],
    ['tools/gst-validator.html', 'official GST Common Portal (gst.gov.in)', '<a href="https://www.gst.gov.in/" rel="nofollow noopener" class="underline font-semibold">official GST Common Portal</a>'],
    ['tools/voter-id-validator.html', "National Voters' Service Portal (NVSP)", `<a href="https://voters.eci.gov.in/" rel="nofollow noopener" class="underline font-semibold">Voters' Service Portal</a>`],
    ['tools/upi-validator.html', 'does not process payments. We only validate the format of the identifier.', 'does not process payments or check bank account ownership. For UPI network information, refer to <a href="https://www.npci.org.in/what-we-do/upi/product-overview/" rel="nofollow noopener" class="underline font-semibold">NPCI UPI</a>. We only validate the format of the identifier.'],
    ['tools/vehicle-validator.html', 'Not affiliated with VAHAN, Parivahan, or Government of India.', 'Not affiliated with VAHAN, Parivahan, or Government of India. For official vehicle services, visit <a href="https://parivahan.gov.in/" rel="nofollow noopener" class="underline font-semibold">Parivahan Sewa</a>.'],
    ['tools/driving-license-validator.html', 'Not affiliated with RTO or Government of India.', 'Not affiliated with RTO or Government of India. For official driving licence services, visit <a href="https://parivahan.gov.in/" rel="nofollow noopener" class="underline font-semibold">Parivahan Sewa</a>.']
  ];

  for (const [rel, from, to] of replacements) {
    const filePath = path.join(ROOT, rel);
    if (!fs.existsSync(filePath)) continue;
    let html = fs.readFileSync(filePath, 'utf8');
    if (!html.includes(to)) html = html.replace(from, to);
    fs.writeFileSync(filePath, html);
  }

  const jsonSafe = [
    ['tools/pan-validator.html', `"text": "This tool validates the format and pattern of the PAN. For official status checks (like checking if the PAN is linked to Aadhaar), please visit the <a href="https://www.incometax.gov.in/" rel="nofollow noopener" class="underline font-semibold">official Income Tax e-Filing portal</a>."`, `"text": "This tool validates the format and pattern of the PAN. For official status checks like checking if the PAN is linked to Aadhaar, please visit the official Income Tax e-Filing portal."`],
    ['tools/gst-validator.html', `"text": "This tool is for format validation. For official compliance, return filing, or checking active taxpayer status, you must use the <a href="https://www.gst.gov.in/" rel="nofollow noopener" class="underline font-semibold">official GST Common Portal</a>."`, `"text": "This tool is for format validation. For official compliance, return filing, or checking active taxpayer status, you must use the official GST Common Portal."`]
  ];

  for (const [rel, from, to] of jsonSafe) {
    const filePath = path.join(ROOT, rel);
    if (!fs.existsSync(filePath)) continue;
    fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8').replaceAll(from, to));
  }
}

function removeUnsupportedAiClaims() {
  const files = [
    'blog/how-to-verify-documents-online.html',
    'blog/online-document-verification-guide.html',
    'blog/online-document-verification.html',
    'blog/verify-documents-online.html',
    'blog/detect-fake-documents-online-guide.html'
  ];

  const replacements = [
    [/Learn how to verify documents online and detect fake, forged, edited, or AI-generated files instantly with VerifyDocs\. Secure, fast, and AI-powered fraud detection\./g, 'Learn how to verify document formats online, spot fake-document warning signs, and use official sources for final confirmation.'],
    [/Learn how to verify documents online and detect fake, forged, edited, or AI-generated files instantly using VerifyDocs\. Fast, secure, and AI-powered\./g, 'Learn how to verify document formats online, spot fake-document warning signs, and use official sources for final confirmation.'],
    [/VerifyDocs helps you detect fake, forged, edited, or AI-generated documents instantly\. Upload PDFs, images, and certificates for fast online verification and fraud detection\./g, 'Learn how to understand fake-document risks, run private browser-based format checks, and confirm important records with official sources.'],
    [/VerifyDocs is an online document verification platform that helps users detect fake, forged, edited, or AI-generated documents instantly\. Simply upload your file and let our advanced detection system analyze it within seconds\./g, 'VerifyDocs is a privacy-first utility site for browser-based document-number format checks and educational guides. Use it to catch structural errors, then rely on official portals or issuers for final verification.'],
    [/Manual checking is no longer enough\. The most effective way to detect fake documents is by using AI-powered verification tools like VerifyDocs\./g, 'Manual checking is no longer enough for high-risk decisions. Use browser-based format checks as a first pass, then confirm important records with the official issuer or government portal.'],
    [/<strong>Step 1:<\/strong> Upload your file securely\.<br>/g, '<strong>Step 1:</strong> Check the document number format privately in your browser.<br>'],
    [/<strong>Step 2:<\/strong> VerifyDocs scans the document instantly\.<br>/g, '<strong>Step 2:</strong> Review structural errors, checksum results, or format guidance.<br>'],
    [/<strong>Step 3:<\/strong> AI analyzes signs of tampering(?: or forgery)?\.<br>/g, '<strong>Step 3:</strong> Use the relevant official portal for legal status or identity confirmation.<br>'],
    [/<strong>Step 4:<\/strong> Get your verification result in seconds\./g, '<strong>Step 4:</strong> Treat format validation as a first-pass check, not legal proof.'],
    [/✔ AI-powered fraud detection<br>/g, '✔ Browser-based format validation<br>'],
    [/✔ AI-powered detection system<br>/g, '✔ Browser-based format checking<br>'],
    [/✔ Safe and secure uploads<br>/g, '✔ No sensitive document-number uploads for validators<br>'],
    [/AI-powered fraud detection/g, 'browser-based format validation'],
    [/AI-powered detection system/g, 'browser-based format checking'],
    [/Fast, secure, and AI-powered/g, 'Fast, private, and browser-based'],
    [/detect fake, forged, edited, or AI-generated files instantly/g, 'understand fake-document risks and run private format checks'],
    [/Detect Fake, Forged & AI-Generated Files Instantly/g, 'Understand Fake, Forged & AI-Generated File Risks'],
    [/Online Document Verification: Detect Fake, Edited & AI-Generated Files Instantly/g, 'Online Document Verification: Format Checks, Official Sources, and Privacy']
  ];

  for (const rel of files) {
    const filePath = path.join(ROOT, rel);
    if (!fs.existsSync(filePath)) continue;
    let html = fs.readFileSync(filePath, 'utf8');
    for (const [from, to] of replacements) html = html.replace(from, to);
    fs.writeFileSync(filePath, html);
  }
}

function addToolServiceSchema() {
  const toolsDir = path.join(ROOT, 'tools');
  for (const name of fs.readdirSync(toolsDir).filter((file) => file.endsWith('.html'))) {
    const rel = `tools/${name}`;
    let html = read(rel);
    if (html.includes('"@type": "Service"')) continue;
    const slug = name.replace(/\.html$/, '');
    const title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || slug).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const desc = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || `${title} on VerifyDocs.online.`;
    const service = jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${SITE}/tools/${slug}#service`,
      name: title,
      serviceType: 'Browser-based document format validation and utility tool',
      provider: { '@id': ORG_ID },
      areaServed: { '@type': 'Country', name: 'India' },
      url: `${SITE}/tools/${slug}`,
      description: desc,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      termsOfService: `${SITE}/terms`
    });
    html = html.replace('</head>', `  ${service}\n</head>`);
    write(rel, html);
  }
}

fixHomepage();
fixAbout();
fixContradictionPost();
fixBlogIndex();
addOfficialLinks();
removeUnsupportedAiClaims();
addToolServiceSchema();
