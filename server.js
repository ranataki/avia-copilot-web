require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const app = express();

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static('.'));

// Ensure data directory and emails.json exist
async function ensureEmailsFile() {
    const dataDir = path.join(__dirname, 'data');
    const emailsPath = path.join(dataDir, 'emails.json');
    
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
    }
    
    try {
        await fs.access(emailsPath);
    } catch {
        await fs.writeFile(emailsPath, JSON.stringify({ emails: [] }, null, 2));
    }
}

// API endpoint to handle email signups
app.post('/api/signup', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        await ensureEmailsFile();

        // Read existing emails
        const emailsPath = path.join(__dirname, 'data', 'emails.json');
        const data = await fs.readFile(emailsPath, 'utf8');
        const emailList = JSON.parse(data);

        // Check if email already exists
        if (emailList.emails.includes(email)) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Add new email
        emailList.emails.push(email);

        // Save updated list
        await fs.writeFile(emailsPath, JSON.stringify(emailList, null, 2));
        console.log('Added email:', email);
        console.log('Current list:', emailList.emails);

        res.json({ success: true });
    } catch (error) {
        console.error('Error handling signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get all emails (password protected)
app.get('/api/emails', async (req, res) => {
    try {
        const emailsPath = path.join(__dirname, 'data', 'emails.json');
        const data = await fs.readFile(emailsPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error getting emails:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 4000;

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Weather API proxy
app.get('/.netlify/functions/avwx', async (req, res) => {
    const { icao } = req.query;
    console.log('AVWX request for:', icao);
    console.log('AVWX token:', process.env.AVWX_TOKEN);
    
    if (!icao || !/^K[A-Z]{3}$/.test(icao)) {
        console.log('Invalid ICAO code:', icao);
        return res.status(400).json({ error: 'Invalid ICAO code' });
    }

    try {
        const url = `https://avwx.rest/api/metar/${icao}?options=summary,translate`;
        console.log('Fetching from:', url);
        
        const response = await fetch(url, {
            headers: { 
                Authorization: `Bearer ${process.env.AVWX_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const text = await response.text();
            console.error('AVWX API error:', response.status, text);
            throw new Error(`AVWX API error: ${response.status} - ${text}`);
        }
        
        const data = await response.json();
        console.log('AVWX success for:', icao);
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        }).json(data);
    } catch (error) {
        console.error('AVWX proxy error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch weather data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
});
