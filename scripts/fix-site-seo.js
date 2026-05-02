const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://verifydocs.online';
const UPDATED = '2026-05-02';
const OG_IMAGE = `${SITE_URL}/assets/docs_3d.png`;
const AUTHOR = {
  '@type': 'Person',
  name: 'Mohit Kumar',
  url: SITE_URL,
  affiliation: {
    '@type': 'Organization',
    name: 'VerifyDocs.online',
    url: SITE_URL
  }
};
const PUBLISHER = {
  '@type': 'Organization',
  name: 'VerifyDocs.online',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/assets/icon.svg`
  }
};

const htmlFiles = walk(ROOT)
  .filter((file) => file.endsWith('.html'))
  .filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`));

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

function toUrlPath(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.replace(/\/index\.html$/, '/')}`;
  return `/${rel.replace(/\.html$/, '')}`;
}

function pageUrl(file) {
  return `${SITE_URL}${toUrlPath(file)}`;
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textFrom(html, regex) {
  const match = html.match(regex);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function titleOf(html, file) {
  const title = textFrom(html, /<title>([\s\S]*?)<\/title>/i);
  if (title) return title;
  return path.basename(file, '.html').replace(/-/g, ' ');
}

function descriptionOf(html) {
  return textFrom(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i)
    || 'Free browser-based document validation, PDF, image, media, and utility tools from VerifyDocs.online.';
}

function h1Of(html) {
  return textFrom(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();
}

function isBlog(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/').startsWith('blog/') && !file.endsWith(`${path.sep}index.html`) && !file.endsWith(`${path.sep}admin.html`);
}

function isTool(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/').startsWith('tools/');
}

function isHindi(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/').startsWith('hi/');
}

function isPublicIndexable(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  return ![
    '404.html',
    'blog/admin.html',
    'login.html',
    'google288b8860a1817b14.html'
  ].includes(rel);
}

function localExists(urlPath) {
  if (urlPath === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
  const normalized = urlPath.replace(/^\/+/, '');
  return fs.existsSync(path.join(ROOT, `${normalized}.html`)) || fs.existsSync(path.join(ROOT, normalized, 'index.html'));
}

function alternateLinks(file) {
  const urlPath = toUrlPath(file);
  const links = [
    `<link rel="alternate" hreflang="en-IN" href="${pageUrl(file)}">`
  ];

  if (urlPath === '/' && localExists('/hi/')) {
    links.push(`<link rel="alternate" hreflang="hi-IN" href="${SITE_URL}/hi/">`);
  }

  if (urlPath.startsWith('/tools/') && localExists(`/hi${urlPath}`)) {
    links.push(`<link rel="alternate" hreflang="hi-IN" href="${SITE_URL}/hi${urlPath}">`);
  }

  links.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(file)}">`);
  return links.join('\n  ');
}

function stripSeo(html) {
  return html
    .replace(/\n?\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/\n?\s*<link\s+rel=["']alternate["']\s+hreflang=["'][^"']+["'][^>]*>/gi, '')
    .replace(/\n?\s*<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/\n?\s*<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/\n?\s*<meta\s+name=["']robots["'][^>]*>/gi, '')
    .replace(/\n?\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
}

function extractFaq(html) {
  const entities = [];
  const questionRegex = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<div[^>]*class=["'][^"']*faq-answer[^"']*["'][^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = questionRegex.exec(html)) && entities.length < 10) {
    const question = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const answer = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (question && answer) {
      entities.push({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      });
    }
  }
  const buttonFaqRegex = /<div[^>]*class=["'][^"']*faq-item[^"']*["'][^>]*>[\s\S]*?<button[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/button>\s*<div[^>]*class=["'][^"']*faq-answer[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = buttonFaqRegex.exec(html)) && entities.length < 10) {
    const question = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const answer = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (question && answer && !entities.some((entity) => entity.name === question)) {
      entities.push({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      });
    }
  }
  return entities;
}

function schemaBlocks(html, file) {
  const url = pageUrl(file);
  const title = titleOf(html, file);
  const description = descriptionOf(html);
  const name = h1Of(html) || title.replace(/\s*\|\s*verifydocs\.online$/i, '');
  const crumbs = breadcrumbsFor(file, name);
  const blocks = [];

  if (path.basename(file) === 'index.html' && path.dirname(file) === ROOT) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'VerifyDocs.online',
      url: SITE_URL,
      logo: `${SITE_URL}/assets/icon.svg`,
      description: 'Privacy-first browser-based Indian document validation, PDF, image, media, and utility tools.',
      founder: AUTHOR,
      foundingDate: '2026',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN'
      },
      sameAs: [
        'https://twitter.com/verifydocs',
        'https://instagram.com/verifydocs'
      ]
    });
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'VerifyDocs.online',
      url: SITE_URL,
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` }
    });
  }

  if (isTool(file)) {
    const faq = extractFaq(html);
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name,
      url,
      description,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }
    });
    if (faq.length) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq
      });
    }
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use ${name}`,
      description: `Use ${name} on VerifyDocs.online in your browser without uploading private data.`,
      totalTime: 'PT1M',
      step: [
        { '@type': 'HowToStep', name: 'Open the tool', text: `Open the ${name} page on VerifyDocs.online.` },
        { '@type': 'HowToStep', name: 'Enter the value', text: 'Enter or paste the value you want to check in the browser-based tool.' },
        { '@type': 'HowToStep', name: 'Review the result', text: 'Read the instant validation result and fix any format errors shown on screen.' }
      ]
    });
  }

  if (isBlog(file)) {
    const published = textFrom(html, /"datePublished"\s*:\s*"([^"]+)"/i) || UPDATED;
    const modified = textFrom(html, /"dateModified"\s*:\s*"([^"]+)"/i) || published;
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: name,
      description,
      author: AUTHOR,
      publisher: PUBLISHER,
      datePublished: published,
      dateModified: modified,
      mainEntityOfPage: url,
      inLanguage: 'en-IN'
    });

    if (/how to|validate|verify/i.test(name)) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        description,
        step: [
          { '@type': 'HowToStep', name: 'Check the document type', text: 'Identify the document number or file type you want to validate.' },
          { '@type': 'HowToStep', name: 'Use a trusted tool', text: 'Use a privacy-first browser-based checker or the relevant official portal.' },
          { '@type': 'HowToStep', name: 'Confirm with official sources', text: 'Treat online format validation as a first check and confirm legal status with the official authority when needed.' }
        ]
      });
    }
  }

  if (['about.html', 'contact.html'].includes(path.basename(file))) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': path.basename(file) === 'contact.html' ? 'ContactPage' : 'AboutPage',
      name,
      url,
      description,
      isPartOf: { '@type': 'WebSite', name: 'VerifyDocs.online', url: SITE_URL },
      publisher: PUBLISHER
    });
  }

  if (crumbs.length > 1) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    });
  }

  return blocks.map((block) => `<script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n</script>`).join('\n  ');
}

function breadcrumbsFor(file, name) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const crumbs = [{ name: 'Home', url: SITE_URL }];
  if (rel.startsWith('tools/')) {
    crumbs.push({ name: 'Tools', url: `${SITE_URL}/#tools` });
    crumbs.push({ name, url: pageUrl(file) });
  } else if (rel.startsWith('blog/') && rel !== 'blog/index.html') {
    crumbs.push({ name: 'Blog', url: `${SITE_URL}/blog/` });
    crumbs.push({ name, url: pageUrl(file) });
  } else if (!['index.html', 'hi/index.html'].includes(rel)) {
    crumbs.push({ name, url: pageUrl(file) });
  }
  return crumbs;
}

function buildSeo(html, file) {
  const title = titleOf(html, file);
  const description = descriptionOf(html);
  const url = pageUrl(file);
  const type = isBlog(file) ? 'article' : 'website';
  const robots = isPublicIndexable(file)
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, nofollow';
  return [
    `<link rel="canonical" href="${url}">`,
    alternateLinks(file),
    `<meta name="robots" content="${robots}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
    schemaBlocks(html, file)
  ].filter(Boolean).join('\n  ');
}

function cleanInternalLinks(html) {
  return html
    .replace(/(href=["'])(\.\.?\/[^"']*?)index\.html([?#][^"']*)?(["'])/gi, '$1$2$3$4')
    .replace(/(href=["'])(\.\.?\/[^"']*?)\.html([?#][^"']*)?(["'])/gi, '$1$2$3$4')
    .replace(/(href=["'])\/([^"']*?)index\.html([?#][^"']*)?(["'])/gi, '$1/$2$3$4')
    .replace(/(href=["'])\/([^"']*?)\.html([?#][^"']*)?(["'])/gi, '$1/$2$3$4')
    .replace(/(["'])(\.\.?\/[^"']*?)index\.html([?#][^"']*)?\1/gi, '$1$2$3$1')
    .replace(/(["'])(\.\.?\/[^"']*?)\.html([?#][^"']*)?\1/gi, '$1$2$3$1')
    .replace(/(slug:\s*["'])([^"']*?)\.html(["'])/gi, '$1$2$3');
}

function addUpdatedStamp(html, file) {
  if (!isTool(file) || /Last updated:/i.test(html)) return html;
  return html.replace(
    /(<h1[^>]*>[\s\S]*?<\/h1>)/i,
    `$1\n  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted mb-6">Last updated: ${UPDATED}</p>`
  );
}

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  if (!/<head[\s>]/i.test(html)) continue;
  html = cleanInternalLinks(html);
  html = stripSeo(html);
  html = addUpdatedStamp(html, file);
  if (!/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(
      /(<title>[\s\S]*?<\/title>)/i,
      `$1\n  <meta name="description" content="${esc(descriptionOf(html))}">`
    );
  }
  html = html.replace(/(<meta\s+name=["']description["'][^>]*>)/i, `$1\n  ${buildSeo(html, file)}`);
  fs.writeFileSync(file, html);
}

dedupeSitemap();
updateVercelRedirects();

function dedupeSitemap() {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return;
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const seen = new Set();
  const urls = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)]
    .map((match) => match[0])
    .filter((block) => {
      const loc = textFrom(block, /<loc>([\s\S]*?)<\/loc>/i);
      if (!loc || seen.has(loc)) return false;
      seen.add(loc);
      return true;
    });
  fs.writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls.join('\n  ')}\n</urlset>\n`);
}

function updateVercelRedirects() {
  const vercelPath = path.join(ROOT, 'vercel.json');
  if (!fs.existsSync(vercelPath)) return;
  const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const redirects = config.redirects || [];
  const hasHtmlRedirect = redirects.some((redirect) => redirect.source === '/:path*.html');
  if (!hasHtmlRedirect) {
    redirects.push({
      source: '/:path*.html',
      destination: '/:path*',
      permanent: true
    });
  }
  config.redirects = redirects;
  fs.writeFileSync(vercelPath, `${JSON.stringify(config, null, 2)}\n`);
}
