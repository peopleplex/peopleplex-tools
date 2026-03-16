// Vercel Serverless Function - Multi-Provider AI Proxy
// Priority: ANTHROPIC_API_KEY → GROQ_API_KEY (free, fast) → GEMINI_API_KEY → OPENAI_API_KEY

export default async function handler(req, res) {
  console.log(`[API Proxy] Incoming request: ${req.method} to /api/generate`);
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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, prompt, model, max_tokens = 4000, system } = req.body;

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

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let resultText = '';

    if (anthropicKey) {
      try {
        console.log('Attempting Anthropic API...');
        const apiModel = model || 'claude-3-sonnet-20240229';
        const body = { model: apiModel, max_tokens, messages: apiMessages, temperature: 0.7 };
        if (system) body.system = system;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json(data);
        } else {
          const error = await response.text();
          console.error('Anthropic API error:', error);
        }
      } catch (e) {
        console.error('Anthropic network/fetch error:', e.message);
      }
    }

    // Fallback to other providers if Anthropic is not available or fails
    if (groqKey) {
      try {
        console.log('Attempting Groq API...');
        const groqMessages = system ? [{ role: 'system', content: system }, ...apiMessages] : apiMessages;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            max_tokens: max_tokens,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          resultText = data.choices[0].message.content;
          return res.status(200).json({ content: [{ type: 'text', text: resultText }] });
        } else {
          const error = await response.text();
          console.error('Groq API error:', error);
        }
      } catch (e) {
        console.error('Groq network/fetch error:', e.message);
      }
    }

    if (geminiKey) {
      try {
        console.log('Attempting Gemini API...');
        const geminiModel = 'gemini-1.5-flash-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
        const geminiPrompt = system ? `[INSTRUCTIONS]\n${system}\n\n[USER INPUT]\n${promptText}` : promptText;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
            generationConfig: { maxOutputTokens: max_tokens, temperature: 0.7 },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            resultText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ content: [{ type: 'text', text: resultText }] });
          }
        } else {
          const error = await response.text();
          console.error('Gemini API error:', error);
        }
      } catch (e) {
        console.error('Gemini network/fetch error:', e.message);
      }
    }

    if (openaiKey) {
      try {
        console.log('Attempting OpenAI API...');
        const openaiMessages = system ? [{ role: 'system', content: system }, ...apiMessages] : apiMessages;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: openaiMessages,
            max_tokens,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          resultText = data.choices[0].message.content;
          return res.status(200).json({ content: [{ type: 'text', text: resultText }] });
        } else {
          const error = await response.text();
          console.error('OpenAI API error:', error);
        }
      } catch (e) {
        console.error('OpenAI network/fetch error:', e.message);
      }
    }

    // If all API calls fail
    return res.status(500).json({
      error: 'All API providers failed',
      message: 'Could not connect to any configured AI service. Please check your API keys and service status.',
    });

  } catch (error) {
    console.error('Error in API proxy:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
