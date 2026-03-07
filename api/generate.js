// Vercel Serverless Function - Multi-Provider AI Proxy
// Priority: ANTHROPIC_API_KEY → GROQ_API_KEY (free, fast) → GEMINI_API_KEY → OPENAI_API_KEY

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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, prompt, model, max_tokens = 4000 } = req.body;

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
      // ══════════════════════════════════════════════════════════
      // ANTHROPIC CLAUDE
      // ══════════════════════════════════════════════════════════
      console.log('Using Anthropic API...');
      const apiModel = model || 'claude-3-sonnet-20240229'; // Fallback model

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: apiModel, max_tokens, messages: apiMessages, temperature: 0.7 }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Anthropic API error:', error);
        // If Anthropic fails, we'll let the logic fall through to the next provider
      } else {
        // Anthropic returns the right format — return directly
        const data = await response.json();
        return res.status(200).json(data);
      }

    } 
    
    // Fallback to other providers if Anthropic is not available or fails
    if (groqKey) {
      // ══════════════════════════════════════════════════════════
      // GROQ — 100% FREE, No Credit Card, Ultra Fast
      // ══════════════════════════════════════════════════════════
      console.log('Falling back to Groq API (free)...');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: apiMessages,
          max_tokens: max_tokens,
          temperature: 0.7,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('Groq API error:', responseText);
        // Let it fall through to the next provider
      } else {
        const data = JSON.parse(responseText);
        resultText = data.choices[0].message.content;
        // Return in Anthropic-compatible format
        return res.status(200).json({ content: [{ type: 'text', text: resultText }] });
      }

    } 
    
    if (geminiKey) {
      // ══════════════════════════════════════════════════════════
      // GOOGLE GEMINI
      // ══════════════════════════════════════════════════════════
      console.log('Falling back to Google Gemini API...');

      const geminiModel = 'gemini-1.5-flash-latest';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { maxOutputTokens: max_tokens, temperature: 0.7 },
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('Gemini API error:', responseText);
        // Let it fall through
      } else {
        const data = JSON.parse(responseText);
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            // Fall through
        } else {
            resultText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ content: [{ type: 'text', text: resultText }] });
        }
      }
    } 
    
    if (openaiKey) {
      // ══════════════════════════════════════════════════════════
      // OPENAI GPT
      // ══════════════════════════════════════════════════════════
      console.log('Falling back to OpenAI API...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: apiMessages,
          max_tokens,
          temperature: 0.7,
        }),
      });

      const responseText = await response.text();
      if (response.ok) {
        const data = JSON.parse(responseText);
        resultText = data.choices[0].message.content;
        return res.status(200).json({ content: [{ type: 'text', text: resultText }] });
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
