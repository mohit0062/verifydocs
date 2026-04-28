const REPO_OWNER = 'mohit0062';
const REPO_NAME = 'verifydocs';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeSlug = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, title, slug, description, content } = req.body || {};

  const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
  const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SUPABASE_KEY = (process.env.SUPABASE_KEY || '').trim();
  const VERCEL_DEPLOY_HOOK_URL = (process.env.VERCEL_DEPLOY_HOOK_URL || '').trim();

  const safeTitle = String(title || '').trim();
  const safeDescription = String(description || '').trim();
  const safeSlug = normalizeSlug(slug || title);
  const dateStr = new Date().toISOString().split('T')[0];

  if (!safeTitle || !safeSlug || !content) {
    return res.status(400).json({ error: 'Title, slug, and content are required' });
  }

  if (!ADMIN_PASSWORD || !GITHUB_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Server is missing required environment variables' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const githubFetch = async (path, options = {}) => {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      let message = 'GitHub API error';
      try {
        const error = await response.json();
        message = error.message || message;
      } catch (_) {}
      throw new Error(`${path}: ${message}`);
    }

    return response.json();
  };

  const getFile = async (path) => {
    const data = await githubFetch(path);
    return {
      sha: data.sha,
      content: Buffer.from(data.content, 'base64').toString('utf8')
    };
  };

  const getFileSha = async (path) => {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.sha;
  };

  const commitFile = async (path, fileContent, message, sha = null) => {
    const body = {
      message,
      content: Buffer.from(fileContent).toString('base64')
    };
    if (sha) body.sha = sha;

    return githubFetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(safeTitle)} | verifydocs.online</title>
  <meta name="description" content="${escapeHtml(safeDescription)}">
  <link rel="canonical" href="https://verifydocs.online/blog/${safeSlug}.html">
  <link rel="alternate" hreflang="en-IN" href="https://verifydocs.online/blog/${safeSlug}.html">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230066cc'/%3E%3Cpath d='M16 6l6 4v6c0 5-6 9-6 9s-6-4-6-9v-6z' fill='white'/%3E%3C/svg%3E">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{primary:'#0066cc','text-main':'#0f172a','text-muted':'#64748b','border-col':'#e2e8f0'},fontFamily:{sans:['Inter','sans-serif'],mono:['JetBrains Mono','monospace']}}}}</script>
  <style>body{background:#f8fafc;font-family:'Inter',sans-serif}.prose p{margin-bottom:1rem;line-height:1.75}.prose h2{margin-top:2rem;margin-bottom:.75rem;font-size:1.25rem;font-weight:700}.prose ul{margin-bottom:1rem;padding-left:1.5rem;list-style:disc}.prose li{margin-bottom:.4rem}</style>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-T80N8X570N"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-T80N8X570N');</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530" crossorigin="anonymous"></script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${escapeHtml(safeTitle)}",
    "description": "${escapeHtml(safeDescription)}",
    "author": { "@type": "Organization", "name": "verifydocs.online" },
    "publisher": { "@type": "Organization", "name": "verifydocs.online" },
    "datePublished": "${dateStr}",
    "dateModified": "${dateStr}",
    "mainEntityOfPage": "https://verifydocs.online/blog/${safeSlug}.html",
    "inLanguage": "en-IN"
  }
  </script>
</head>
<body>
<nav class="bg-white/80 backdrop-blur-md border-b border-border-col sticky top-0 z-50 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="../index.html" class="flex items-center gap-2 font-bold text-xl text-text-main no-underline">
      <span>VerifyDocs<span class="text-primary">.online</span></span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
      <a href="../index.html" class="hover:text-primary transition-colors">Home</a>
      <a href="../blog/index.html" class="hover:text-primary transition-colors">Blog</a>
    </div>
  </div>
</nav>

<main class="max-w-2xl mx-auto px-4 py-10">
  <nav class="text-xs text-text-muted mb-6 flex items-center gap-1.5">
    <a href="../index.html" class="hover:text-primary">Home</a><span>&gt;</span><a href="../blog/index.html" class="hover:text-primary">Blog</a><span>&gt;</span>
    <span class="text-text-main font-medium">${escapeHtml(safeTitle)}</span>
  </nav>

  <div class="text-xs text-text-muted mb-4 flex items-center gap-3">
    <span>${dateStr}</span><span>&middot;</span>
    <span id="view-count" class="bg-gray-100 px-2 py-0.5 rounded text-text-main font-medium">Loading views...</span>
  </div>

  <h1 class="text-3xl md:text-4xl font-extrabold text-text-main mb-6 leading-tight">${escapeHtml(safeTitle)}</h1>

  <div class="prose text-text-muted text-sm mb-12">
    ${content}
  </div>

  <div class="mt-16 pt-10 border-t border-border-col">
    <h3 class="text-xl font-bold text-text-main mb-6">User Comments</h3>
    <div id="comment-list" class="mb-10 space-y-6">
      <p class="text-sm text-text-muted">Loading comments...</p>
    </div>
    <div class="bg-white border border-border-col rounded-2xl p-6">
      <h4 class="font-bold text-sm mb-4 text-text-main">Leave a Comment</h4>
      <form id="comment-form" class="space-y-4">
        <input type="text" id="comment-name" placeholder="Your Name" class="w-full h-10 px-4 border border-border-col rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required>
        <textarea id="comment-text" placeholder="Share your thoughts..." class="w-full p-4 border border-border-col rounded-xl text-sm h-28 focus:outline-none focus:ring-2 focus:ring-primary/20" required></textarea>
        <button type="submit" class="bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition">Post Comment</button>
      </form>
    </div>
  </div>
</main>
<script src="../assets/js/blog-features.js"></script>
</body>
</html>`;

  const saveToSupabase = async () => {
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        title: safeTitle,
        slug: safeSlug,
        description: safeDescription,
        content,
        author: 'Admin'
      })
    });

    if (!supabaseRes.ok) {
      let message = 'Supabase Error';
      try {
        const error = await supabaseRes.json();
        message = error.message || JSON.stringify(error);
      } catch (_) {}
      throw new Error(message);
    }
  };

  const updateBlogIndex = async () => {
    const { sha, content: indexContent } = await getFile('blog/index.html');
    const blogHrefRegex = new RegExp(`href=["'](?:\\.\\/|\\.\\.\\/blog\\/)${safeSlug}\\.html["']`);

    if (blogHrefRegex.test(indexContent)) return;

    const newCard = `
    <a href="./${safeSlug}.html" class="post-card bg-white border border-border-col rounded-2xl p-6 block no-underline">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">POST</div>
        <div class="flex-1">
          <div class="text-xs text-text-muted mb-1.5">${dateStr} &middot; Blog</div>
          <h2 class="text-lg font-bold text-text-main mb-2">${escapeHtml(safeTitle)}</h2>
          <p class="text-sm text-text-muted leading-relaxed">${escapeHtml(safeDescription)}</p>
          <span class="inline-block mt-3 text-primary text-sm font-semibold">Read guide &rarr;</span>
        </div>
      </div>
    </a>
`;

    const targetMarker = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
    if (!indexContent.includes(targetMarker)) {
      throw new Error('Blog index grid marker not found');
    }

    const updatedContent = indexContent.replace(targetMarker, `${targetMarker}\n${newCard}`);
    await commitFile('blog/index.html', updatedContent, `Add ${safeTitle} to blog index`, sha);
  };

  const updateSitemap = async () => {
    const { sha, content: sitemapContent } = await getFile('sitemap.xml');
    const cleanUrl = `https://verifydocs.online/blog/${safeSlug}`;

    if (sitemapContent.includes(`<loc>${cleanUrl}</loc>`)) return;

    const sitemapEntry = `  <url>
    <loc>${cleanUrl}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
`;

    const updatedContent = sitemapContent.replace('</urlset>', `${sitemapEntry}</urlset>`);
    await commitFile('sitemap.xml', updatedContent, `Add ${safeTitle} to sitemap`, sha);
  };

  const triggerDeploy = async () => {
    if (!VERCEL_DEPLOY_HOOK_URL) return false;

    const deployRes = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
    if (!deployRes.ok) {
      throw new Error('Blog saved, but Vercel deploy hook failed');
    }

    return true;
  };

  try {
    await saveToSupabase();

    const existingBlogSha = await getFileSha(`blog/${safeSlug}.html`);
    await commitFile(`blog/${safeSlug}.html`, htmlContent, `Add/Update blog: ${safeTitle}`, existingBlogSha);
    await updateBlogIndex();
    await updateSitemap();
    const deployTriggered = await triggerDeploy();

    return res.status(200).json({
      success: true,
      url: `/blog/${safeSlug}.html`,
      deployTriggered,
      message: deployTriggered
        ? 'Saved to Supabase and GitHub. Vercel deployment started!'
        : 'Saved to Supabase and GitHub. Set VERCEL_DEPLOY_HOOK_URL to auto-deploy.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
