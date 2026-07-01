const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

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
  // 1. Authenticate the Cron request
  const CRON_SECRET = (process.env.CRON_SECRET || '').trim();
  if (CRON_SECRET) {
    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized: Invalid cron token' });
    }
  }

  const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
  const SUPABASE_KEY = (process.env.SUPABASE_KEY || '').trim();
  const VERCEL_DEPLOY_HOOK_URL = (process.env.VERCEL_DEPLOY_HOOK_URL || '').trim();
  
  const AWS_ACCESS_KEY_ID = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const AWS_SECRET_ACCESS_KEY = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  const AWS_REGION = (process.env.AWS_REGION || 'us-east-1').trim();
  const AWS_CLAUDE_MODEL_ID = (process.env.AWS_CLAUDE_MODEL_ID || process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0').trim();

  if (!GITHUB_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Server missing GitHub or Supabase configuration variables' });
  }

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    return res.status(500).json({ error: 'Server missing AWS credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)' });
  }

  try {
    // 2. Fetch existing blog post titles from Supabase to prevent duplicate topics
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?select=title`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let existingTitles = [];
    if (supabaseRes.ok) {
      const posts = await supabaseRes.json();
      existingTitles = posts.map(p => p.title);
    } else {
      console.warn("Failed to fetch existing blog titles from Supabase, proceeding with empty list.");
    }

    // 3. Setup AWS Bedrock Runtime Client
    const bedrockClient = new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });

    const existingTitlesStr = existingTitles.length > 0 
      ? existingTitles.map(t => `- "${t}"`).join('\n')
      : 'None yet';

    const systemPrompt = `You are a professional SEO copywriter and technical writer specializing in Indian documents, digital tools, web utilities, and online privacy.
Your goal is to write a unique, highly informative, and engaging blog post.
The blog post must focus on one of the following general areas:
- Indian document verification, format structure, or checksum algorithms (e.g., Aadhaar checksum rules, Voter ID/EPIC structure, PAN layout, GSTIN verification, Driving License format)
- PDF tools (e.g., merging, splitting, compressing, locking/unlocking PDFs online securely)
- Image tools (e.g., AI upscaling, background removal, SVG vectors, PSD files online)
- Digital privacy & safety tips in India (e.g., protecting against UPI scams, sharing masked Aadhaar, salary slip masking, safe KYC procedures)

Do NOT write about any of the following topics which are already covered:
${existingTitlesStr}

Generate a new, unique topic that is not in the list above.

You must return ONLY a raw JSON object with the following keys:
1. "title": A compelling, click-worthy, SEO-optimized title for the blog post (e.g., "Aadhaar Masking: How to Safely Share Your ID Online").
2. "slug": A URL-friendly version of the title (e.g., "aadhaar-masking-safety-guide"). Only use lowercase letters, numbers, and hyphens. Do not include ".html" in the slug.
3. "description": A short, compelling meta description for the blog post (max 155 characters) for SEO.
4. "content": The body of the blog post in clean HTML format. Use standard HTML tags like <h2>, <p>, <strong>, <ul>, and <li>. Do NOT include <h1>, <html>, <head>, <body>, or <nav> tags. The content must be detailed, high quality, and at least 500-800 words.

Return ONLY the raw JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\`, and do not add any conversational text before or after the JSON.`;

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 3500,
      messages: [
        {
          role: "user",
          content: systemPrompt
        }
      ]
    };

    // 4. Call Claude via AWS Bedrock
    const command = new InvokeModelCommand({
      modelId: AWS_CLAUDE_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    const result = JSON.parse(Buffer.from(response.body).toString("utf-8"));
    const responseText = result.content[0].text;

    // Clean output in case LLM wraps it in markdown backticks
    let cleanText = responseText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    const blogData = JSON.parse(cleanText);
    const { title, slug, description, content } = blogData;

    const safeTitle = String(title || '').trim();
    const safeDescription = String(description || '').trim();
    const safeSlug = normalizeSlug(slug || title);
    const dateStr = new Date().toISOString().split('T')[0];

    if (!safeTitle || !safeSlug || !content) {
      throw new Error("Claude generated an incomplete response missing title, slug, or content.");
    }

    // 5. Publish logic helper functions (similar to publish.js)
    const githubFetch = async (path, options = {}) => {
      const gRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          ...(options.headers || {})
        }
      });

      if (!gRes.ok) {
        let msg = 'GitHub API error';
        try {
          const err = await gRes.json();
          msg = err.message || msg;
        } catch (_) {}
        throw new Error(`${path}: ${msg}`);
      }

      return gRes.json();
    };

    const getFile = async (path) => {
      const data = await githubFetch(path);
      return {
        sha: data.sha,
        content: Buffer.from(data.content, 'base64').toString('utf8')
      };
    };

    const getFileSha = async (path) => {
      const gRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      });
      if (!gRes.ok) return null;
      const data = await gRes.json();
      return data.sha;
    };

    const commitFile = async (path, fileContent, msg, sha = null) => {
      const body = {
        message: msg,
        content: Buffer.from(fileContent).toString('base64')
      };
      if (sha) body.sha = sha;

      return githubFetch(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    };

    // Construct the HTML page (re-using template from publish.js)
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(safeTitle)} | verifydocs.online</title>
  <meta name="description" content="${escapeHtml(safeDescription)}">
  <link rel="canonical" href="https://verifydocs.online/blog/${safeSlug}">
  <link rel="alternate" hreflang="en-IN" href="https://verifydocs.online/blog/${safeSlug}">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230066cc'/%3E%3Cpath d='M16 6l6 4v6c0 5-6 9-6 9s-6-4-6-9v-6z' fill='white'/%3E%3C/svg%3E">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{primary:'#0066cc','text-main':'#0f172a','text-muted':'#64748b','border-col':'#e2e8f0'},fontFamily:{sans:['Inter','sans-serif'],mono:['JetBrains Mono','monospace']}}}}</script>
  <style>body{background:#f8fafc;font-family:'Inter',sans-serif}.prose p{margin-bottom:1rem;line-height:1.75}.prose h2{margin-top:2rem;margin-bottom:.75rem;font-size:1.25rem;font-weight:700}.prose ul{margin-bottom:1rem;padding-left:1.5rem;list-style:disc}.prose li{margin-bottom:.4rem}</style>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-T80N8X570N"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-T80N8X570N');</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530"
     crossorigin="anonymous"></script>
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
    "mainEntityOfPage": "https://verifydocs.online/blog/${safeSlug}",
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

  <!-- AdSense Fluid Ad Unit -->
  <div class="my-8">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1094606266002530"
     crossorigin="anonymous"></script>
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-format="fluid"
         data-ad-layout-key="-ee-5+3k-6b+4"
         data-ad-client="ca-pub-1094606266002530"
         data-ad-slot="4838930102"></ins>
    <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
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

    // 6. Save to Supabase
    const supabaseSaveRes = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
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
        emoji: '📄',
        category: 'Blog',
        read_time: '5 min read',
        published_at: dateStr,
        is_published: true
      })
    });

    if (!supabaseSaveRes.ok) {
      let msg = 'Supabase Save Error';
      try {
        const err = await supabaseSaveRes.json();
        msg = err.message || JSON.stringify(err);
      } catch (_) {}
      throw new Error(msg);
    }

    // 7. Commit to GitHub (html file)
    const existingBlogSha = await getFileSha(`blog/${safeSlug}.html`);
    await commitFile(`blog/${safeSlug}.html`, htmlContent, `Auto-generate blog: ${safeTitle}`, existingBlogSha);

    // 8. Update blog/index.html (add to allPosts list)
    const { sha: indexSha, content: indexContent } = await getFile('blog/index.html');
    if (!indexContent.includes(`slug: '${safeSlug}.html'`)) {
      const newPostObj = `{
        slug: '${safeSlug}.html',
        title: '${safeTitle.replace(/'/g, "\\'")}',
        description: '${safeDescription.replace(/'/g, "\\'")}',
        emoji: '📄',
        category: 'Blog',
        read_time: '5 min read',
        published_at: '${dateStr}'
      },`;

      const targetMarker = 'allPosts = [';
      if (indexContent.includes(targetMarker)) {
        const updatedIndexContent = indexContent.replace(targetMarker, `${targetMarker}\n      ${newPostObj}`);
        await commitFile('blog/index.html', updatedIndexContent, `Add auto-generated ${safeTitle} to blog index`, indexSha);
      }
    }

    // 9. Update sitemap.xml
    const { sha: sitemapSha, content: sitemapContent } = await getFile('sitemap.xml');
    const cleanUrl = `https://verifydocs.online/blog/${safeSlug}`;
    if (!sitemapContent.includes(`<loc>${cleanUrl}</loc>`)) {
      const sitemapEntry = `  <url>
    <loc>${cleanUrl}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
`;
      const updatedSitemapContent = sitemapContent.replace('</urlset>', `${sitemapEntry}</urlset>`);
      await commitFile('sitemap.xml', updatedSitemapContent, `Add auto-generated ${safeTitle} to sitemap`, sitemapSha);
    }

    // 10. Trigger Vercel Deploy Hook if configured
    let deployTriggered = false;
    if (VERCEL_DEPLOY_HOOK_URL) {
      const deployRes = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
      deployTriggered = deployRes.ok;
    }

    return res.status(200).json({
      success: true,
      title: safeTitle,
      slug: safeSlug,
      deployTriggered,
      message: 'Successfully generated and published the new blog post!'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'An error occurred during cron generation' });
  }
};
