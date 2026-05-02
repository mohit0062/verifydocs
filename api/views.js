const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://onkvkaldgndyilwkmzqi.supabase.co').trim();
const SUPABASE_KEY = (process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ua3ZrYWxkZ25keWlsd2ttenFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDUwNTYsImV4cCI6MjA5Mjc4MTA1Nn0.f3Tm6yShjmOy4I0x6sVGNddu7pVrAtBW3KDh8QNdLR4').trim();

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
