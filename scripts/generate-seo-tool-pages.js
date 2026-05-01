const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'tools');
const SITE_URL = 'https://verifydocs.online';
const TODAY = '2026-04-30';

const tools = [
  { slug: 'psd-to-png', title: 'PSD to PNG', category: 'Design Tools', anchor: 'design-tools', kind: 'design', input: 'PSD', output: 'PNG', description: 'Convert Photoshop PSD files into PNG assets for transparent web graphics, previews, and design handoff workflows.' },
  { slug: 'psd-to-jpg', title: 'PSD to JPG', category: 'Design Tools', anchor: 'design-tools', kind: 'design', input: 'PSD', output: 'JPG', description: 'Convert PSD design files into JPG previews for sharing, review, and upload-ready creative workflows.' },
  { slug: 'ai-to-png', title: 'AI to PNG', category: 'Design Tools', anchor: 'design-tools', kind: 'design', input: 'AI', output: 'PNG', description: 'Convert Adobe Illustrator AI artwork into PNG files for websites, documents, mockups, and product assets.' },
  { slug: 'ai-to-jpg', title: 'AI to JPG', category: 'Design Tools', anchor: 'design-tools', kind: 'design', input: 'AI', output: 'JPG', description: 'Convert Illustrator AI files into JPG previews that are easier to share across teams and clients.' },
  { slug: 'svg-to-png', title: 'SVG to PNG', category: 'Design Tools', anchor: 'design-tools', kind: 'design', input: 'SVG', output: 'PNG', description: 'Convert SVG logos, icons, and vector illustrations into PNG images with a clean browser-friendly workflow.' },
  { slug: 'svg-to-jpg', title: 'SVG to JPG', category: 'Design Tools', anchor: 'design-tools', kind: 'design', input: 'SVG', output: 'JPG', description: 'Convert SVG artwork into JPG files for platforms that need raster images with a solid background.' },
  { slug: 'word-counter', title: 'Word Counter', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Count words in articles, forms, descriptions, essays, and SEO content with a clean text utility page.' },
  { slug: 'character-counter', title: 'Character Counter', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Count characters, spaces, and text length for meta descriptions, posts, SMS copy, and field limits.' },
  { slug: 'case-converter', title: 'Case Converter', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Convert text between uppercase, lowercase, title case, sentence case, slug case, and developer-friendly formats.' },
  { slug: 'remove-duplicate-lines', title: 'Remove Duplicate Lines', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Remove repeated lines from lists, logs, CSV snippets, keyword batches, and text data.' },
  { slug: 'json-formatter', title: 'JSON Formatter', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Format JSON into readable indentation for API debugging, documentation, and data review.' },
  { slug: 'json-minifier', title: 'JSON Minifier', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Minify JSON by removing unnecessary whitespace for smaller payloads and compact sharing.' },
  { slug: 'xml-formatter', title: 'XML Formatter', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Format XML markup with indentation so nested nodes, attributes, and structures are easier to read.' },
  { slug: 'html-minifier', title: 'HTML Minifier', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Minify HTML snippets and pages by removing unnecessary whitespace and comments.' },
  { slug: 'css-minifier', title: 'CSS Minifier', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Compress CSS rules and declarations for leaner stylesheets, demos, and embedded snippets.' },
  { slug: 'js-minifier', title: 'JS Minifier', category: 'Developer Tools', anchor: 'developer-tools', kind: 'developer', description: 'Minify JavaScript snippets for smaller embeds, faster sharing, and cleaner demo payloads.' },
  { slug: 'qr-code-generator', title: 'QR Code Generator', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Generate QR codes for URLs, text, contact information, campaigns, and quick mobile sharing.' },
  { slug: 'barcode-generator', title: 'Barcode Generator', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Generate barcode assets for inventory labels, product workflows, and printable references.' },
  { slug: 'password-generator', title: 'Password Generator', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Create strong random passwords with length, number, symbol, and readability options.' },
  { slug: 'url-encoder-decoder', title: 'URL Encoder / Decoder', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Encode and decode URLs, query strings, reserved characters, and web-safe text.' },
  { slug: 'base64-encode-decode', title: 'Base64 Encode / Decode', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Encode text to Base64 and decode Base64 strings back into readable plain text.' },
  { slug: 'md5-sha-generator', title: 'MD5 / SHA Generator', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Generate MD5, SHA-1, SHA-256, and related hashes for text checks and developer workflows.' },
  { slug: 'color-picker', title: 'Color Picker', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Pick colors, preview swatches, and copy color values for design and development.' },
  { slug: 'hex-to-rgb', title: 'HEX to RGB', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Convert HEX color values into RGB values for CSS, design systems, and documentation.' },
  { slug: 'unit-converter', title: 'Unit Converter', category: 'Utility Tools', anchor: 'utility-tools', kind: 'utility', description: 'Convert common measurement units for length, weight, temperature, data, and everyday calculations.' },
  { slug: 'video-to-mp3', title: 'Video to MP3', category: 'Media Tools', anchor: 'media-tools', kind: 'media', description: 'Extract audio from video files into MP3-ready media workflows for clips, lectures, and quick sharing.' },
  { slug: 'audio-compressor', title: 'Audio Compressor', category: 'Media Tools', anchor: 'media-tools', kind: 'media', description: 'Compress audio files to reduce size before uploading, sending, or archiving.' },
  { slug: 'video-compressor', title: 'Video Compressor', category: 'Media Tools', anchor: 'media-tools', kind: 'media', description: 'Compress video files for uploads, forms, messaging, and lighter online sharing.' },
  { slug: 'gif-maker', title: 'GIF Maker', category: 'Media Tools', anchor: 'media-tools', kind: 'media', description: 'Create GIF-ready workflows from clips or frames for reactions, tutorials, and product previews.' },
  { slug: 'image-to-gif', title: 'Image to GIF', category: 'Media Tools', anchor: 'media-tools', kind: 'media', description: 'Turn multiple images into a GIF workflow for simple frame-based animations.' }
];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function schemaFor(tool) {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.title,
      url: `${SITE_URL}/tools/${tool.slug}`,
      description: tool.description,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `What is the ${tool.title} tool?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${tool.title} is a free online utility page for ${tool.description.toLowerCase()}`
          }
        },
        {
          '@type': 'Question',
          name: `Is ${tool.title} free to use?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Yes. ${tool.title} is listed as a free online tool on VerifyDocs.online.`
          }
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: tool.category, item: `${SITE_URL}/#${tool.anchor}` },
        { '@type': 'ListItem', position: 3, name: tool.title, item: `${SITE_URL}/tools/${tool.slug}` }
      ]
    }
  ], null, 2);
}

function pageFor(tool) {
  const isMedia = tool.kind === 'media';
  const isDeveloper = tool.kind === 'developer';
  const toneClass = {
    design: 'tone-design',
    developer: 'tone-dev',
    utility: 'tone-util',
    media: 'tone-media'
  }[tool.kind];
  const title = `${tool.title} - Free Online ${tool.category}`;
  const related = tools
    .filter((item) => item.category === tool.category && item.slug !== tool.slug)
    .slice(0, 4);

  const workspaceCopy = tool.input && tool.output
    ? `Upload a ${tool.input} file, prepare it for ${tool.output} export, and keep the workflow organized from this dedicated clean URL.`
    : `Paste or upload content when the live processor is connected, then use this clean URL as the dedicated ${tool.title} workspace.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(tool.description)}">
  <link rel="canonical" href="${SITE_URL}/tools/${tool.slug}">
  <link rel="alternate" hreflang="en-IN" href="${SITE_URL}/tools/${tool.slug}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(tool.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/tools/${tool.slug}">
  <meta name="robots" content="index, follow">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230066cc'/%3E%3Cpath d='M16 6l6 4v6c0 5-6 9-6 9s-6-4-6-9v-6z' fill='white'/%3E%3C/svg%3E">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: { primary: '#0066cc', accent: '#138808', warning: '#ff9933', 'text-main': '#0f172a', 'text-muted': '#64748b', 'border-col': '#e2e8f0' } } } };
  </script>
  <style>
    body { min-height: 100dvh; background: #f8fafc; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    .page-shell { background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.96)); }
    .tone-design { --tone: #7c3aed; --soft: #f0e9ff; }
    .tone-dev { --tone: #0f766e; --soft: #e7f7f4; }
    .tone-util { --tone: #0066cc; --soft: #e7f1ff; }
    .tone-media { --tone: #ff9933; --soft: #fff1df; }
    .hero-badge { display: inline-flex; align-items: center; gap: .5rem; border: 1px solid #e2e8f0; background: #fff; border-radius: 999px; padding: .45rem .75rem; color: var(--tone); font-size: .72rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    .panel { border: 1px solid rgba(203,213,225,.9); border-radius: 8px; background: rgba(255,255,255,.94); box-shadow: 0 22px 62px -48px rgba(15,23,42,.45); }
    .tool-icon { display: flex; width: 3.5rem; height: 3.5rem; align-items: center; justify-content: center; border-radius: 8px; background: var(--soft); color: var(--tone); font-weight: 950; }
    .ad-slot { display: flex; min-height: 280px; align-items: center; justify-content: center; border: 1px dashed rgba(148,163,184,.7); border-radius: 8px; background: repeating-linear-gradient(135deg, rgba(148,163,184,.08) 0 12px, transparent 12px 24px), rgba(255,255,255,.78); color: #94a3b8; font-size: .7rem; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
    .input-shell { min-height: 11rem; border: 2px dashed rgba(0,102,204,.2); border-radius: 8px; background: #fff; }
    ${isMedia ? 'body { background: #0f172a; } .page-shell { background: linear-gradient(135deg, #0f172a, #172033); color: #f8fafc; } .panel { background: rgba(15,23,42,.82); border-color: rgba(148,163,184,.24); color: #f8fafc; } .panel p, .muted { color: #b6c2cf; } .ad-slot { background: rgba(15,23,42,.7); border-color: rgba(148,163,184,.28); color: #64748b; }' : ''}
    ${isDeveloper ? '.code-type { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }' : ''}
  </style>
  <script type="application/ld+json">${schemaFor(tool)}</script>
</head>
<body>
  <nav class="sticky top-0 z-50 border-b border-border-col bg-white/90 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <a href="../index.html" class="flex items-center gap-2 text-lg font-black text-text-main no-underline">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">V</span>
        VerifyDocs<span class="text-primary">.online</span>
      </a>
      <div class="hidden items-center gap-5 text-sm font-bold text-text-muted md:flex">
        <a href="../index.html" class="hover:text-primary">Home</a>
        <a href="../index.html#${tool.anchor}" class="hover:text-primary">${esc(tool.category)}</a>
        <a href="../contact.html" class="hover:text-primary">Contact</a>
      </div>
    </div>
  </nav>

  <main class="page-shell">
    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
      <nav class="mb-7 flex flex-wrap items-center gap-2 text-sm ${isMedia ? 'text-slate-300' : 'text-text-muted'}">
        <a href="../index.html" class="hover:text-primary">Home</a>
        <span>/</span>
        <a href="../index.html#${tool.anchor}" class="hover:text-primary">${esc(tool.category)}</a>
        <span>/</span>
        <span class="${isMedia ? 'text-white' : 'text-text-main'} font-bold">${esc(tool.title)}</span>
      </nav>

      <div class="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article class="min-w-0">
          <div class="${toneClass}">
            <span class="hero-badge">${esc(tool.category)}</span>
            <div class="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
              <span class="tool-icon">${esc(tool.title.split(' ').map((word) => word[0]).join('').slice(0, 3).toUpperCase())}</span>
              <div>
                <h1 class="max-w-4xl text-4xl font-black leading-tight tracking-normal md:text-6xl">${esc(tool.title)}</h1>
                <p class="mt-4 max-w-3xl text-lg font-medium leading-relaxed ${isMedia ? 'text-slate-300' : 'text-text-muted'}">${esc(tool.description)}</p>
              </div>
            </div>
          </div>

          <div class="panel mt-8 p-5 md:p-7">
            <h2 class="text-2xl font-black ${isDeveloper ? 'code-type' : ''}">Tool workspace</h2>
            <p class="muted mt-2 text-sm font-semibold leading-relaxed">${esc(workspaceCopy)}</p>
            <div class="input-shell mt-5 flex flex-col items-center justify-center p-6 text-center">
              <div class="text-sm font-black ${isMedia ? 'text-slate-100' : 'text-text-main'}">${esc(tool.title)} input area</div>
              <p class="muted mt-2 max-w-lg text-sm">This SEO-friendly page is ready for the live processor. The clean URL, metadata, schema, and ad-safe layout are already in place.</p>
            </div>
            <div class="mt-5 flex flex-col gap-3 sm:flex-row">
              <a href="../index.html#${tool.anchor}" class="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-black text-white no-underline">View all ${esc(tool.category)}</a>
              ${tool.slug === 'svg-to-png' || tool.slug === 'svg-to-jpg' ? '<a href="./image-tools.html?tool=svg-to-png-jpg" class="inline-flex h-11 items-center justify-center rounded-lg border border-border-col bg-white px-5 text-sm font-black text-text-main no-underline">Open SVG workspace</a>' : ''}
            </div>
          </div>

          <section class="panel mt-6 p-5 md:p-7">
            <h2 class="text-2xl font-black">How to use ${esc(tool.title)}</h2>
            <ol class="mt-4 grid gap-3 text-sm font-semibold leading-relaxed ${isMedia ? 'text-slate-300' : 'text-text-muted'} md:grid-cols-3">
              <li class="rounded-lg border border-border-col/70 p-4">1. Open the dedicated ${esc(tool.title)} page.</li>
              <li class="rounded-lg border border-border-col/70 p-4">2. Add your input and choose the output settings.</li>
              <li class="rounded-lg border border-border-col/70 p-4">3. Download or copy the result when processing is complete.</li>
            </ol>
          </section>

          <section class="panel mt-6 p-5 md:p-7">
            <h2 class="text-2xl font-black">Related tools</h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              ${related.map((item) => `<a href="./${item.slug}.html" class="rounded-lg border border-border-col/80 p-4 text-sm font-black no-underline ${isMedia ? 'text-slate-100 hover:border-orange-300/50' : 'text-text-main hover:border-primary/30'}">${esc(item.title)}<span class="mt-1 block text-xs font-semibold ${isMedia ? 'text-slate-400' : 'text-text-muted'}">${esc(item.description)}</span></a>`).join('\n              ')}
            </div>
          </section>

          <section class="panel mt-6 p-5 md:p-7">
            <h2 class="text-2xl font-black">FAQ</h2>
            <div class="mt-4 space-y-4 text-sm leading-relaxed ${isMedia ? 'text-slate-300' : 'text-text-muted'}">
              <div><h3 class="${isMedia ? 'text-white' : 'text-text-main'} font-black">What is ${esc(tool.title)}?</h3><p class="mt-1">${esc(tool.description)}</p></div>
              <div><h3 class="${isMedia ? 'text-white' : 'text-text-main'} font-black">Is this tool free?</h3><p class="mt-1">Yes, this page is part of the free VerifyDocs.online tools library.</p></div>
            </div>
          </section>
        </article>

        <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div class="ad-slot" aria-label="Advertisement placement">Advertisement</div>
          <div class="panel p-5">
            <h2 class="text-sm font-black uppercase tracking-[0.14em] ${isMedia ? 'text-slate-200' : 'text-text-main'}">SEO ready</h2>
            <ul class="mt-4 space-y-3 text-sm font-semibold ${isMedia ? 'text-slate-300' : 'text-text-muted'}">
              <li>Clean canonical URL</li>
              <li>Meta title and description</li>
              <li>WebApplication schema</li>
              <li>FAQ and breadcrumb schema</li>
              <li>AdSense-friendly sidebar space</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function updateSitemap() {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const entries = tools.map((tool) => `  <url>
    <loc>${SITE_URL}/tools/${tool.slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`).join('\n');

  for (const tool of tools) {
    const pattern = new RegExp(`\\s*<url>\\s*<loc>${SITE_URL.replace(/\./g, '\\.')}/tools/${tool.slug}</loc>[\\s\\S]*?</url>`, 'g');
    sitemap = sitemap.replace(pattern, '');
  }

  sitemap = sitemap.replace(/\s*<\/urlset>\s*$/, `\n${entries}\n</urlset>\n`);
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
}

for (const tool of tools) {
  fs.writeFileSync(path.join(TOOLS_DIR, `${tool.slug}.html`), pageFor(tool), 'utf8');
}
updateSitemap();
console.log(`Generated ${tools.length} SEO tool pages.`);
