const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const SITE_URL = 'https://verifydocs.online';
const DATE = '2026-05-03';

const posts = [
  {
    slug: 'convert-pdf-to-image-online-free',
    title: 'How to Convert PDF to Image Online Free',
    description: 'Learn how to convert PDF pages into JPG or PNG images online, when to use image export, and how to keep files readable.',
    category: 'PDF',
    emoji: 'PDF',
    readTime: '5 min read',
    sections: [
      ['Why Convert a PDF to an Image?', 'PDF files are great for documents, but many forms, apps, and messaging platforms work better with image files. Converting a PDF page to an image helps when you need a quick preview, a form upload, a WhatsApp share, or a page screenshot without opening a PDF viewer.'],
      ['Free PDF to Image Converter Online', 'A free PDF to image converter lets you upload a PDF and export selected pages as image files. On VerifyDocs, you can use the PDF tools page, choose PDF to Image, select the pages you need, and download PNG output directly.'],
      ['PDF to JPG or PDF to PNG?', 'Use JPG when file size matters and the page is mostly photos or scans. Use PNG when the page has small text, forms, signatures, screenshots, or sharp lines. PNG usually keeps text clearer, while JPG is easier to share in low-size workflows.'],
      ['How to Convert PDF Pages to Images', 'Open the PDF to Image tool, upload one PDF, enter page numbers such as 1 or 1,3-5, choose a scale if available, and run the tool. For long PDFs, export only the pages you need so the result stays fast and manageable.'],
      ['Privacy Tip', 'Avoid uploading sensitive documents to random converters. For IDs, certificates, bank files, invoices, or legal pages, use a trusted workflow and delete downloads you no longer need.']
    ]
  },
  {
    slug: 'pdf-to-jpg-vs-png-which-is-better',
    title: 'PDF to JPG vs PNG: Which Image Format Should You Choose?',
    description: 'Compare PDF to JPG and PDF to PNG conversion for document uploads, forms, screenshots, scans, and readable text.',
    category: 'PDF',
    emoji: 'IMG',
    readTime: '6 min read',
    sections: [
      ['JPG and PNG Are Built for Different Jobs', 'JPG and PNG may look similar at first, but they behave differently. JPG compresses photos well and creates smaller files. PNG preserves sharp edges and text better, which matters for documents, forms, receipts, and screenshots.'],
      ['When PDF to JPG Makes Sense', 'Choose JPG when the PDF page is photo-heavy, when the upload portal has a strict file-size limit, or when you only need a visual copy for quick sharing. JPG is usually smaller, but repeated compression can make text fuzzy.'],
      ['When PDF to PNG Is Better', 'Choose PNG for documents with small text, tables, signatures, QR codes, screenshots, or official forms. PNG keeps lines crisp and avoids the smudged look that can happen with aggressive JPG compression.'],
      ['Best Format for Indian Forms and Uploads', 'Many Indian application portals accept JPG or PNG, but the best choice depends on the file limit. If the portal asks for a small file, try JPG. If it rejects blurry text, use PNG or increase quality before uploading.'],
      ['Simple Rule', 'For photos, use JPG. For text-heavy pages, use PNG. For important documents, check the final image by zooming in before uploading it anywhere.']
    ]
  },
  {
    slug: 'extract-pdf-pages-as-images',
    title: 'How to Extract PDF Pages as Images',
    description: 'Step-by-step guide to extract selected PDF pages as image files without converting the entire document.',
    category: 'PDF',
    emoji: 'PAGE',
    readTime: '5 min read',
    sections: [
      ['Why Extract Only Selected Pages?', 'You do not always need to convert a full PDF. Sometimes only one certificate page, one invoice page, or one form page is required. Extracting selected pages as images keeps the download smaller and makes uploads faster.'],
      ['Use Page Ranges', 'A good PDF to image tool should let you enter page numbers. Use 1 for the first page, 2,4 for two separate pages, or 1-3 for a range. This avoids creating unnecessary images from every page.'],
      ['Common Page Extraction Examples', 'For a 10-page PDF, entering 1 exports only the first page. Entering 1,5,10 exports three images. Entering 2-4 exports pages two, three, and four. This is useful when only specific evidence or attachments are needed.'],
      ['Keep Image Quality Readable', 'If the output is too blurry, increase the render scale or choose PNG. If the output is too large, reduce the scale or convert fewer pages at a time. Always zoom into the final image before submitting it.'],
      ['When to Split PDF Instead', 'If the receiver accepts PDF, splitting pages may be better than exporting images. If the receiver needs JPG or PNG, PDF to Image is the right workflow.']
    ]
  },
  {
    slug: 'pdf-to-image-for-whatsapp-and-online-forms',
    title: 'PDF to Image for WhatsApp and Online Forms in India',
    description: 'Learn how PDF to image conversion helps with WhatsApp sharing, job applications, KYC uploads, and online form submissions.',
    category: 'PDF',
    emoji: 'FORM',
    readTime: '6 min read',
    sections: [
      ['Why People Convert PDFs for WhatsApp', 'PDFs are useful, but images are often easier to preview in WhatsApp chats. A converted image opens instantly, shows the page thumbnail, and helps the receiver check the document without downloading a PDF first.'],
      ['Online Forms Often Prefer Images', 'Many online forms ask for JPG or PNG uploads instead of PDF. This happens in job applications, school forms, local service forms, and basic KYC workflows. PDF to image conversion helps you prepare the right upload format.'],
      ['Best Settings for Form Uploads', 'Convert only the required page, use PNG for text clarity, and check the portal file-size limit. If the image is too large, reduce the scale or convert to JPG using an image compressor after export.'],
      ['Avoid Cropping Important Details', 'Before uploading, make sure the name, document number, date, signature, and stamp are fully visible. If the image is cut off or unreadable, the form may be rejected.'],
      ['Safety Reminder', 'Share sensitive document images only with trusted people or official portals. Once a PDF becomes an image, it is very easy to forward, screenshot, or store.']
    ]
  },
  {
    slug: 'best-settings-for-pdf-to-image-conversion',
    title: 'Best Settings for PDF to Image Conversion',
    description: 'Understand page range, scale, JPG vs PNG, readability checks, and file-size tips for PDF to image conversion.',
    category: 'PDF',
    emoji: 'SET',
    readTime: '7 min read',
    sections: [
      ['Start with the Page Range', 'The biggest speed improvement is converting only the pages you need. A 30-page PDF can produce 30 images, which is slow and heavy. Enter a page range such as 1, 2-3, or 5 when only a few pages matter.'],
      ['Choose the Right Scale', 'Scale controls output clarity and size. A lower scale creates smaller images but can blur small text. A higher scale makes text sharper but increases file size. For most documents, a medium scale is a good starting point.'],
      ['Pick PNG for Text', 'If your PDF has forms, tables, Aadhaar details, PAN details, invoices, or certificates, PNG is usually safer for readability. It keeps sharp lines and avoids compression artifacts.'],
      ['Use JPG for Photos and Small Uploads', 'JPG is useful when the upload limit is strict or the page is mostly a photo scan. Check the output carefully because heavy JPG compression can make small letters hard to read.'],
      ['Final Quality Checklist', 'Before sharing the image, zoom in and check names, numbers, dates, stamps, QR codes, signatures, and page edges. If anything is unclear, export again with better settings.']
    ]
  }
];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function articleSchema(post) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Person', name: 'Mohit Kumar', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'VerifyDocs.online',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/icon.svg` }
    },
    datePublished: DATE,
    dateModified: DATE,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    inLanguage: 'en-IN'
  }, null, 2);
}

function breadcrumbSchema(post) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` }
    ]
  }, null, 2);
}

function pageFor(post) {
  const sections = post.sections.map(([heading, body]) => `<h2>${esc(heading)}</h2>\n    <p>${esc(body)}</p>`).join('\n\n    ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(post.title)} | verifydocs.online</title>
  <meta name="description" content="${esc(post.description)}">
  <link rel="canonical" href="${SITE_URL}/blog/${post.slug}">
  <link rel="alternate" hreflang="en-IN" href="${SITE_URL}/blog/${post.slug}">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/blog/${post.slug}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/blog/${post.slug}">
  <meta property="og:title" content="${esc(post.title)} | verifydocs.online">
  <meta property="og:description" content="${esc(post.description)}">
  <meta property="og:image" content="${SITE_URL}/assets/pdf_3d.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(post.title)} | verifydocs.online">
  <meta name="twitter:description" content="${esc(post.description)}">
  <meta name="twitter:image" content="${SITE_URL}/assets/pdf_3d.png">
  <script type="application/ld+json">${articleSchema(post)}</script>
  <script type="application/ld+json">${breadcrumbSchema(post)}</script>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230066cc'/%3E%3Cpath d='M16 6l6 4v6c0 5-6 9-6 9s-6-4-6-9v-6z' fill='white'/%3E%3C/svg%3E">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{primary:'#0066cc','text-main':'#0f172a','text-muted':'#64748b','border-col':'#e2e8f0'},fontFamily:{sans:['Inter','sans-serif'],mono:['JetBrains Mono','monospace']}}}}</script>
  <style>body{background:#f8fafc;font-family:'Inter',sans-serif}.prose p{margin-bottom:1rem;line-height:1.75}.prose h2{margin-top:2rem;margin-bottom:.75rem;font-size:1.25rem;font-weight:800;color:#0f172a}.prose ul{margin-bottom:1rem;padding-left:1.5rem;list-style:disc}.prose li{margin-bottom:.4rem}.ad-placement{min-height:250px;border:1px dashed #cbd5e1;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;background:#fff}</style>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-T80N8X570N"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-T80N8X570N');</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530" crossorigin="anonymous"></script>
</head>
<body>
<nav class="bg-white/80 backdrop-blur-md border-b border-border-col sticky top-0 z-50 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="../" class="flex items-center gap-2 font-bold text-xl text-text-main no-underline"><span>VerifyDocs<span class="text-primary">.online</span></span></a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
      <a href="../" class="hover:text-primary transition-colors">Home</a>
      <a href="../tools/pdf-tools?tool=pdf-to-image" class="hover:text-primary transition-colors">PDF to Image</a>
      <a href="../blog/" class="hover:text-primary transition-colors">Blog</a>
    </div>
  </div>
</nav>

<main class="max-w-5xl mx-auto px-4 py-10">
  <nav class="text-xs text-text-muted mb-6 flex items-center gap-1.5">
    <a href="../" class="hover:text-primary">Home</a><span>&gt;</span><a href="../blog/" class="hover:text-primary">Blog</a><span>&gt;</span>
    <span class="text-text-main font-medium">${esc(post.title)}</span>
  </nav>

  <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
    <article class="min-w-0">
      <div class="text-xs text-text-muted mb-4 flex items-center gap-3">
        <span>${DATE}</span><span>&middot;</span><span>${esc(post.readTime)}</span><span>&middot;</span><span>${esc(post.category)}</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-extrabold text-text-main mb-6 leading-tight">${esc(post.title)}</h1>
      <p class="text-lg text-text-muted leading-relaxed mb-8">${esc(post.description)}</p>

      <div class="prose text-text-muted text-sm mb-10">
        ${sections}
      </div>

      <div class="rounded-2xl border border-border-col bg-white p-6">
        <h2 class="text-xl font-extrabold text-text-main">Try PDF to Image Online</h2>
        <p class="mt-2 text-sm leading-relaxed text-text-muted">Use the VerifyDocs PDF tools page to convert selected PDF pages into images for forms, sharing, and previews.</p>
        <a href="../tools/pdf-tools?tool=pdf-to-image" class="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white no-underline">Open PDF to Image Tool</a>
      </div>
    </article>

    <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <div class="ad-placement" aria-label="Advertisement placement">Advertisement</div>
      <div class="rounded-2xl border border-border-col bg-white p-5">
        <h2 class="text-sm font-extrabold uppercase tracking-[0.14em] text-text-main">Related PDF guides</h2>
        <div class="mt-4 space-y-3 text-sm font-semibold">
          ${posts.filter((item) => item.slug !== post.slug).slice(0, 4).map((item) => `<a class="block text-text-muted hover:text-primary" href="./${item.slug}">${esc(item.title)}</a>`).join('\n          ')}
        </div>
      </div>
    </aside>
  </div>
</main>

<footer class="bg-text-main text-white pt-10 pb-6 px-4 mt-10">
  <div class="max-w-6xl mx-auto text-sm text-gray-400">verifydocs.online &middot; Free PDF, document validation, and utility tools.</div>
</footer>
</body>
</html>
`;
}

function updateBlogIndex() {
  const indexPath = path.join(BLOG_DIR, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const block = posts.map((post) => `      {
        slug: '${post.slug}',
        title: '${post.title.replace(/'/g, "\\'")}',
        description: '${post.description.replace(/'/g, "\\'")}',
        emoji: '${post.emoji}',
        category: '${post.category}',
        read_time: '${post.readTime}',
        published_at: '${DATE}'
      }`).join(',\n');

  for (const post of posts) {
    const pattern = new RegExp(`\\s*\\{\\s*slug: '${post.slug}'[\\s\\S]*?published_at: '[^']+'\\s*\\},?`, 'g');
    html = html.replace(pattern, '');
  }

  html = html.replace(/allPosts = \[\s*/, `allPosts = [\n${block},\n`);
  fs.writeFileSync(indexPath, html, 'utf8');
}

function updateSitemap() {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');

  for (const post of posts) {
    const pattern = new RegExp(`\\s*<url><loc>${SITE_URL.replace(/\./g, '\\.')}/blog/${post.slug}</loc>[\\s\\S]*?</url>`, 'g');
    sitemap = sitemap.replace(pattern, '');
  }

  const entries = posts.map((post) => `  <url><loc>${SITE_URL}/blog/${post.slug}</loc><lastmod>${DATE}</lastmod><changefreq>monthly</changefreq><priority>0.76</priority></url>`).join('\n');
  sitemap = sitemap.replace('  <!-- Identity / Document Validators (Priority 0.90) -->', `${entries}\n\n  <!-- Identity / Document Validators (Priority 0.90) -->`);
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
}

for (const post of posts) {
  fs.writeFileSync(path.join(BLOG_DIR, `${post.slug}.html`), pageFor(post), 'utf8');
}
updateBlogIndex();
updateSitemap();

console.log(`Added ${posts.length} PDF to image blog posts.`);
