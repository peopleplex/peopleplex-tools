import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/generate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Proxy the /api/generate route to our mock serverless function
app.post('/api/generate', async (req, res) => {
    try {
        await handler(req, res);
    } catch (err) {
        console.error('Local Server Error:', err);
        res.status(500).json({ error: 'Local Server Error' });
    }
});

// Serve frontend build if exploring from root, but usually Vite handles that
const PORT = 3001;

app.listen(PORT, () => {
    console.log(`🚀 Local API Mock Server running at http://localhost:${PORT}`);
    console.log('You must now run Vite and Proxy it to this server!');
});
