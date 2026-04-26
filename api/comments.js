const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_KEY || '').trim();

module.exports = async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === 'GET') {
    if (!slug) return res.status(400).json({ error: 'Slug required' });
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/comments?blog_slug=eq.${slug}&select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { slug, name, comment } = req.body;
    if (!slug || !name || !comment) return res.status(400).json({ error: 'All fields required' });

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          blog_slug: slug,
          user_name: name,
          comment_text: comment
        })
      });
      const data = await response.json();
      return res.status(201).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
