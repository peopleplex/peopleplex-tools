// Vercel Serverless Function - Anthropic API Proxy
// This keeps your API key secure on the server

export default async function handler(req, res) {
  // ── CORS headers ─────────────────────────────────────────────
  // Restrict to your actual domain in production; use '*' only for local dev
  const allowedOrigins = [
    'https://tools.peopleplex.one',
    'https://peopleplex-tools.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const origin = req.headers.origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ── Handle CORS preflight FIRST (before POST check) ──────────
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Only allow POST after OPTIONS is handled ─────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Accept EITHER format from frontend:
    //   Format A (preferred): { messages: [...], model: "...", max_tokens: N }
    //   Format B (legacy):    { prompt: "...", max_tokens: N }
    const { messages, prompt, model, max_tokens = 2000 } = req.body;

    // Build the messages array — support both formats
    let apiMessages;
    if (messages && Array.isArray(messages) && messages.length > 0) {
      apiMessages = messages;
    } else if (prompt) {
      apiMessages = [{ role: 'user', content: prompt }];
    } else {
      return res.status(400).json({ error: 'Either "messages" array or "prompt" string is required' });
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Use model from request, or fall back to a sensible default
    const apiModel = model || 'claude-sonnet-4-20250514';

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: apiModel,
        max_tokens: max_tokens,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({
        error: 'API call failed',
        details: error,
      });
    }

    const data = await response.json();

    // Return the response
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in API proxy:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
