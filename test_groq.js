import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GROQ_API_KEY;
console.log('Testing Groq connection with key (masked):', key?.substring(0, 10) + '...');

async function test() {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{role: 'user', content: 'test'}],
                max_tokens: 10
            })
        });
        
        console.log('Response Status:', res.status);
        const data = await res.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Connection Failed:', e.message);
    }
}

test();
