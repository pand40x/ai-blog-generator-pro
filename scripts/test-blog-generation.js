const fs = require('fs');
const path = require('path');

const SITE_URL = 'http://localhost:3000';
const MODEL = 'google/gemini-3-flash-preview';

async function generateBlogPost(tone) {
    console.log(`\nGenerating post with tone: ${tone.toUpperCase()} via Localhost API using ${MODEL}...`);
    // Subtopics boş: AI kendi akışını belirlemeli ve SSS eklemeli
    console.log(`Subtopics Injected: NO (Empty String)`);

    try {
        const response = await fetch(`${SITE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'Sosyal Anksiyete',
                tone: tone,
                wordCount: 1500,
                model: MODEL,
                targetAudience: 'genel',
                subtopics: ''
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        if (!response.body) throw new Error('Response body is null');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let chunkCount = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
                    try {
                        const jsonStr = line.slice(6);
                        const data = JSON.parse(jsonStr);
                        if (data.content) {
                            fullContent += data.content;
                            chunkCount++;
                            if (chunkCount % 20 === 0) process.stdout.write('.');
                        }
                    } catch (e) { }
                }
            }
        }
        console.log('\nGeneration completed.');

        if (!fullContent || fullContent.length < 100) throw new Error('Empty content from backend');
        return { content: fullContent, model: MODEL };

    } catch (error) {
        console.error(`❌ Error via Localhost: ${error.message}`);
        return null;
    }
}

async function analyzeBlogPost(content, tone) {
    console.log(`Analyzing ${tone.toUpperCase()} post (length: ${content.length})...`);

    const envPath = path.resolve(__dirname, '../.env.local');
    let apiKey = '';
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts[0] === 'OPENROUTER_API_KEY') apiKey = parts[1].trim().replace(/"/g, '');
        });
    } catch (e) { }

    if (!apiKey) {
        console.log('Skipping analysis (No API Key)');
        return { score: 0, pros: [], cons: [], missingElements: [] };
    }

    const analysisPrompt = `Sen acımasız bir içerik editörüsün. Aşağıdaki blog yazısını şu kriterlere göre değerlendir (0-100 puan):
    1. Giriş Hook'u
    2. Vaka Örneği
    3. Bilimsel Atıf
    4. Terapist Yönlendirmesi
    5. SSS Bölümü (Çok önemli!)
    Yanıt sadece JSON: { "score": 85, "pros": [], "cons": [], "missingElements": [] }
    İÇERİK ÖZETİ: ${content}`; // FULL CONTENT

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'user', content: analysisPrompt }]
            })
        });
        const data = await response.json();
        let resultText = data.choices[0].message.content;
        return JSON.parse(resultText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
        console.error('Analysis error:', e.message);
        return { score: 0, pros: [], cons: ["Analiz hatası"], missingElements: [] };
    }
}

async function run() {
    const TONES = ['samimi'];
    let fullReport = `# Blog Üretim Algoritması - Nihai Test (Subtopics Boş)\n\nTarih: ${new Date().toLocaleString()}\nKonu: Sosyal Anksiyete (Subtopics BOŞ)\nModel: ${MODEL}\n\n`;

    console.log('🚀 Starting NO-Subtopics Test...');

    for (const tone of TONES) {
        const result = await generateBlogPost(tone);
        if (result && result.content) {
            const analysis = await analyzeBlogPost(result.content, tone);

            fullReport += `## Ton: ${tone.toUpperCase()}\n`;
            fullReport += `**Puan:** ${analysis.score}/100\n\n`;
            fullReport += `### ✅ Artılar\n${analysis.pros.map(p => `- ${p}`).join('\n')}\n\n`;
            if (analysis.missingElements.length > 0) {
                fullReport += `### ❌ Eksikler\n${analysis.missingElements.map(m => `- ${m}`).join('\n')}\n` +
                    `NOTE: Eğer SSS buradaysa, subtopics boş olmasına rağmen model SSS üretmemiş demektir.\n\n`;
            } else {
                fullReport += `### ✨ Tam Uyum (SSS Dahil!)\n\n`;
            }
            fullReport += `---\n\n`;
        }
    }

    fs.writeFileSync('blog_generation_test_report.md', fullReport);
    console.log('\n✅ Test tamamlandı! Rapor: blog_generation_test_report.md');
}

run();
