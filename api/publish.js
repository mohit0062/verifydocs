module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, title, slug, description, content } = req.body;

  const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
  const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
  const REPO_OWNER = 'mohit0062';
  const REPO_NAME = 'verifydocs';

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub Token not configured' });
  }

  const dateStr = new Date().toISOString().split('T')[0];

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | VerifyDocs.in</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://verifydocs.in/blog/${slug}.html">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230066cc'/%3E%3Cpath d='M16 6l6 4v6c0 5-6 9-6 9s-6-4-6-9v-6z' fill='white'/%3E%3C/svg%3E">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{primary:'#0066cc','text-main':'#0f172a','text-muted':'#64748b','border-col':'#e2e8f0'},fontFamily:{sans:['Inter','sans-serif'],mono:['JetBrains Mono','monospace']}}}}</script>
  <style>body{background:#f8fafc;font-family:'Inter',sans-serif}.prose p{margin-bottom:1rem;line-height:1.75}.prose h2{margin-top:2rem;margin-bottom:.75rem;font-size:1.25rem;font-weight:700}.prose ul{margin-bottom:1rem;padding-left:1.5rem;list-style:disc}.prose li{margin-bottom:.4rem}</style>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-T80N8X570N"></script>
<script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-T80N8X570N');</script>
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530" crossorigin="anonymous"></script>
</head>
<body>
<nav class="bg-white/80 backdrop-blur-md border-b border-border-col sticky top-0 z-50 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="../index.html" class="flex items-center gap-2 font-bold text-xl text-text-main no-underline">
      <span>VerifyDocs<span class="text-primary">.in</span></span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
      <a href="../index.html" class="hover:text-primary transition-colors">Home</a>
      <a href="../blog/index.html" class="hover:text-primary transition-colors">Blog</a>
    </div>
  </div>
</nav>

<main class="max-w-2xl mx-auto px-4 py-10">
  <nav class="text-xs text-text-muted mb-6 flex items-center gap-1.5">
    <a href="../index.html" class="hover:text-primary">Home</a><span>›</span><a href="../blog/index.html" class="hover:text-primary">Blog</a><span>›</span>
    <span class="text-text-main font-medium">${title}</span>
  </nav>

  <div class="text-xs text-text-muted mb-4 flex items-center gap-3">
    <span>${dateStr}</span>
  </div>

  <h1 class="text-3xl md:text-4xl font-extrabold text-text-main mb-6 leading-tight">${title}</h1>

  <div class="prose text-text-muted text-sm">
    ${content}
  </div>
</main>
</body>
</html>`;

  const commitFile = async (path, content, message, sha = null) => {
    const body = {
      message: message,
      content: Buffer.from(content).toString('base64'),
    };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'GitHub API error');
    }
    return res.json();
  };

  const getFileSha = async (path) => {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
    return null;
  };

  try {
    // 1. Check if blog file exists to get SHA (allows overwriting/updating)
    const existingBlogSha = await getFileSha(`blog/${slug}.html`);
    await commitFile(`blog/${slug}.html`, htmlContent, `Add/Update blog: ${title}`, existingBlogSha);

    // 2. Update blog/index.html
    const indexRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/blog/index.html`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
    });
    
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      const currentContent = Buffer.from(indexData.content, 'base64').toString('utf8');
      
      // Only add to index if it's not already there (prevent duplicates in list)
      if (!currentContent.includes(`href="../blog/${slug}.html"`)) {
        const newCard = `
      <!-- NEW BLOG -->
      <a href="../blog/${slug}.html" class="block bg-white border border-border-col rounded-2xl p-6 hover:shadow-md transition">
        <div class="text-xs text-primary font-semibold mb-2">${dateStr}</div>
        <h2 class="text-xl font-bold text-text-main mb-2">${title}</h2>
        <p class="text-sm text-text-muted line-clamp-2">${description}</p>
      </a>`;

        const targetMarker = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
        if (currentContent.includes(targetMarker)) {
          const updatedContent = currentContent.replace(targetMarker, targetMarker + '\n' + newCard);
          await commitFile('blog/index.html', updatedContent, 'Update blog index', indexData.sha);
        }
      }
    }

    res.status(200).json({ success: true, url: `/blog/${slug}.html` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
