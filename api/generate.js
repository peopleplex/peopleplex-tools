// Vercel Serverless Function - Multi-Provider AI Proxy
// Supports: Google Gemini (FREE), Anthropic Claude, OpenAI GPT
// Priority: GEMINI_API_KEY → ANTHROPIC_API_KEY → OPENAI_API_KEY

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, prompt, model, max_tokens = 2000 } = req.body;

    // Build the prompt text from whatever format frontend sends
    let promptText = '';
    let apiMessages = [];

    if (messages && Array.isArray(messages) && messages.length > 0) {
      apiMessages = messages;
      promptText = messages.map(m => m.content).join('\n');
    } else if (prompt) {
      apiMessages = [{ role: 'user', content: prompt }];
      promptText = prompt;
    } else {
      return res.status(400).json({ error: 'Either "messages" array or "prompt" string is required' });
    }

    // ── Detect which API key is available ─────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let resultText = '';

    if (geminiKey) {
      // ══════════════════════════════════════════════════════════
      // GOOGLE GEMINI (FREE TIER)
      // ══════════════════════════════════════════════════════════
      console.log('Using Google Gemini API (free)...');

      const geminiModel = 'gemini-2.0-flash-lite';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            maxOutputTokens: max_tokens,
            temperature: 0.7,
          },
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('Gemini API error:', responseText);
        return res.status(response.status).json({
          error: 'Gemini API call failed',
          details: responseText,
        });
      }

      const data = JSON.parse(responseText);

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error('Unexpected Gemini response:', responseText);
        return res.status(500).json({ error: 'Unexpected Gemini response format' });
      }

      resultText = data.candidates[0].content.parts[0].text;

    } else if (anthropicKey) {
      // ══════════════════════════════════════════════════════════
      // ANTHROPIC CLAUDE
      // ══════════════════════════════════════════════════════════
      console.log('Using Anthropic API...');
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
        return res.status(response.status).json({ error: 'API call failed', details: error });
      }

      const data = await response.json();
      // Anthropic already returns the format frontend expects
      return res.status(200).json(data);

    } else if (openaiKey) {
      // ══════════════════════════════════════════════════════════
      // OPENAI GPT
      // ══════════════════════════════════════════════════════════
      console.log('Using OpenAI API...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          max_tokens: max_tokens,
          temperature: 0.7,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('OpenAI API error:', responseText);
        return res.status(response.status).json({ error: 'API call failed', details: responseText });
      }

      const data = JSON.parse(responseText);
      resultText = data.choices[0].message.content;

    } else {
      return res.status(500).json({
        error: 'No API key configured',
        message: 'Add GEMINI_API_KEY (free), ANTHROPIC_API_KEY, or OPENAI_API_KEY to Vercel environment variables',
      });
    }

    // ── Return in Anthropic-compatible format (frontend expects this) ──
    return res.status(200).json({
      content: [{ type: 'text', text: resultText }],
    });

  } catch (error) {
    console.error('Error in API proxy:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
