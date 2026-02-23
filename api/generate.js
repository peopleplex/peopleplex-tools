// Vercel Serverless Function - OpenAI API Proxy
// File: api/generate.js

export default async function handler(req, res) {
  // ── CORS headers ─────────────────────────────────────────────
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

  // ── Handle CORS preflight FIRST ──────────────────────────────
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Accept EITHER format from frontend:
    //   Format A (current frontend): { messages: [...], model: "...", max_tokens: N }
    //   Format B (legacy):            { prompt: "...", max_tokens: N }
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

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable not set');
      return res.status(500).json({
        error: 'API key not configured',
        message: 'Please add OPENAI_API_KEY to Vercel environment variables'
      });
    }

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: apiMessages,
        max_tokens: max_tokens,
        temperature: 0.7,
      }),
    });

    const responseText = await response.text();
    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      console.error('OpenAI API error:', responseText);
      return res.status(response.status).json({
        error: 'API call failed',
        status: response.status,
        details: responseText,
      });
    }

    const data = JSON.parse(responseText);
    console.log('Successfully generated response');

    // Transform OpenAI response to match Anthropic format
    // (so the frontend code doesn't need to change)
    const transformedResponse = {
      content: [
        {
          type: 'text',
          text: data.choices[0].message.content
        }
      ],
      model: data.model,
      usage: data.usage
    };

    return res.status(200).json(transformedResponse);

  } catch (error) {
    console.error('Error in API proxy:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
