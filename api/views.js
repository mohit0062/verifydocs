const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_KEY || '').trim();

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Slug required' });

  try {
    // 1. Get current views
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs?slug=eq.${slug}&select=views`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    let currentViews = 0;
    if (getRes.ok) {
      const data = await getRes.json();
      if (data.length > 0) currentViews = data[0].views || 0;
    }

    // 2. Increment views (Simple +1)
    const newViews = currentViews + 1;
    await fetch(`${SUPABASE_URL}/rest/v1/blogs?slug=eq.${slug}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ views: newViews })
    });

    res.status(200).json({ views: newViews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
