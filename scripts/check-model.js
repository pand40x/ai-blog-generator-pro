const fs = require('fs');
const path = require('path');

// .env.local oku
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const firstEqual = line.indexOf('=');
        if (firstEqual > 0) {
            const key = line.substring(0, firstEqual).trim();
            let value = line.substring(firstEqual + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
} catch (e) {
    console.error('Environment error:', e.message);
}

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.5-flash';

async function check() {
    console.log(`Checking model: ${MODEL}`);
    console.log(`API Key: ${API_KEY ? 'Present' : 'Missing'}`);

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Test Script',
                // 'Origin': 'http://localhost:3000', // Node'da Origin header'ı bazen sorun olabilir ama deneyelim
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: 'Say "Test Successful" if you can read this.' }],
                max_tokens: 50,
                stream: false // Explicit false
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const text = await response.text();
            console.error('Error Body:', text);
        } else {
            const data = await response.json();
            console.log('Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

check();
