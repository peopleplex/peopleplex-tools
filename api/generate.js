// Vercel Serverless Function - Anthropic Claude API Proxy
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

    // ── Try Anthropic key first, fall back to OpenAI ───────────
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey) {
      // ── ANTHROPIC / CLAUDE ─────────────────────────────────
      console.log('Calling Anthropic API...');
      const apiModel = model || 'claude-sonnet-4-20250514';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
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
      return res.status(200).json(data);

    } else if (openaiKey) {
      // ── OPENAI / GPT ───────────────────────────────────────
      console.log('Calling OpenAI API...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: apiMessages,
          max_tokens: max_tokens,
          temperature: 0.7,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('OpenAI API error:', responseText);
        return res.status(response.status).json({
          error: 'API call failed',
          status: response.status,
          details: responseText,
        });
      }

      const data = JSON.parse(responseText);

      // Transform OpenAI response to Anthropic format (frontend expects this)
      const transformedResponse = {
        content: [{ type: 'text', text: data.choices[0].message.content }],
        model: data.model,
        usage: data.usage,
      };

      return res.status(200).json(transformedResponse);

    } else {
      return res.status(500).json({
        error: 'No API key configured',
        message: 'Please add ANTHROPIC_API_KEY or OPENAI_API_KEY to Vercel environment variables',
      });
    }

  } catch (error) {
    console.error('Error in API proxy:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
