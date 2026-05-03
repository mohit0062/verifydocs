const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://onkvkaldgndyilwkmzqi.supabase.co').trim();
const SUPABASE_KEY = (process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ua3ZrYWxkZ25keWlsd2ttenFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDUwNTYsImV4cCI6MjA5Mjc4MTA1Nn0.f3Tm6yShjmOy4I0x6sVGNddu7pVrAtBW3KDh8QNdLR4').trim();

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { name, email, topic, message } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim();
    const cleanTopic = String(topic || '').trim();
    const cleanMessage = String(message || '').trim();

    if (!cleanName || !cleanEmail || !cleanTopic || !cleanMessage) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        topic: cleanTopic,
        message: cleanMessage
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: data?.message || 'Unable to save message in Supabase. Ensure table contact_messages exists.'
      });
    }

    return res.status(200).json({ success: true, data: data?.[0] || null });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to send message.' });
  }
};

