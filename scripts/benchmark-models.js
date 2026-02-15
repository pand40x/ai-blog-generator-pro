const fs = require('fs');
const path = require('path');
const http = require('http');

const SITE_URL = 'http://localhost:3000';

// Kullanıcının Model Listesi (HARFİYEN UYGULANIYOR)
const MODELS = [
    'google/gemini-3-flash-preview',
    'anthropic/claude-sonnet-4.5' // Kullanıcı Talebi
];

async function generateBlogPost(model) {
    console.log(`\n🚀 Testing Model: ${model}`);
    console.log(`Generating post for "Sosyal Anksiyete" (Target: 700 words)...`);

    const startTime = Date.now();
    let ttfb = 0;

    // Fetch yerine doğrudan Node http kullanalım ki 'fetch failed' sebebini görelim
    // Veya fetch'i wrap edelim. Fetch daha kolay.
    // 'fetch failed' genelde Node 18+ sorunu. 127.0.0.1 deneyelim.

    const API_URL = 'http://127.0.0.1:3000/api/generate';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'Sosyal Anksiyete',
                tone: 'samimi',
                wordCount: 700,
                model: model,
                targetAudience: 'genel',
                subtopics: ''
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`${response.status} - ${errText}`);
        }

        if (!response.body) throw new Error('Response body is null');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let firstByteTime = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (firstByteTime === 0) {
                firstByteTime = Date.now();
                ttfb = firstByteTime - startTime;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
                    try {
                        const jsonStr = line.slice(6);
                        const data = JSON.parse(jsonStr);
                        if (data.content) {
                            fullContent += data.content;
                            process.stdout.write('.');
                        }
                    } catch (e) { }
                }
            }
        }
        console.log('\nGeneration completed.');

        const totalTime = Date.now() - startTime;

        if (!fullContent || fullContent.length < 50) throw new Error('Empty or too short content');

        return {
            success: true,
            model: model,
            content: fullContent,
            wordCount: fullContent.split(/\s+/).length,
            ttfb: ttfb,
            totalTime: totalTime
        };

    } catch (error) {
        console.error(`\n❌ Error with ${model}: ${error.message}`);
        if (error.cause) console.error("Cause:", error.cause);
        return {
            success: false,
            model: model,
            error: error.message,
            ttfb: 0,
            totalTime: Date.now() - startTime
        };
    }
}

async function analyzeBlogPost(content) {
    if (!content) return { total_score: 0 };

    console.log(`Analyzing content quality...`);

    const envPath = path.resolve(__dirname, '../.env.local');
    let apiKey = '';
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts[0] === 'OPENROUTER_API_KEY') apiKey = parts[1].trim().replace(/"/g, '');
        });
    } catch (e) { }

    if (!apiKey) return { total_score: 0 };

    const analysisPrompt = `Sen uzman bir klinik psikolog süpervizörüsün. Aşağıdaki blog yazısını 4 kritere göre 1-5 arası puanla değerlendir:
    1. UZMANLIK (Authority)
    2. EMPATİ (Empathy)
    3. YAPI (Structure - Vaka, SSS var mı?)
    4. ETİK (Safety)

    Yanıt SADECE JSON olmalı:
    {
      "authority_score": 0, "empathy_score": 0, "structure_score": 0, "safety_score": 0,
      "total_score": 0, "comment": "Kısa yorum.", "missing_elements": []
    }

    İÇERİK ÖZETİ: ${content.substring(0, 15000)}`;

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
        return { total_score: 0, comment: "Analiz Hatası" };
    }
}

async function run() {
    let report = `# Gemini 3 Flash vs Claude Sonnet 4.5 Raporu\n\n**Tarih:** ${new Date().toLocaleString()}\n**Hedef:** 700 Kelime\n\n`;
    report += `| Model | Puan | Uzmanlık | Empati | Yapı | Kelime | Hız (TTFB) | Toplam |\n`;
    report += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

    const results = [];

    for (const model of MODELS) {
        const result = await generateBlogPost(model);
        let analysis = {
            total_score: 0, authority_score: 0, empathy_score: 0, structure_score: 0, safety_score: 0,
            missing_elements: [], comment: '-'
        };

        if (result.success) {
            const rawAnalysis = await analyzeBlogPost(result.content);
            analysis = { ...analysis, ...rawAnalysis };
        }

        const row = `| **${model}** | **${analysis.total_score}** | ${analysis.authority_score} | ${analysis.empathy_score} | ${analysis.structure_score} | ${result.wordCount || 0} | ${(result.ttfb || 0)}ms | ${(result.totalTime / 1000).toFixed(1)}s |`;
        report += `${row}\n`;

        results.push({ ...result, ...analysis });
    }

    report += `\n## Uzman Yorumları\n\n`;
    for (const r of results) {
        if (r.success) {
            report += `### ${r.model}\n> ${r.comment}\n`;
            if (r.missing_elements && r.missing_elements.length > 0) report += `- ⚠️ ${r.missing_elements.join(', ')}\n\n`;
            else report += `- ✅ Tam.\n\n`;
        } else {
            report += `### ${r.model}\n❌ HATA: ${r.error}\n\n`;
        }
    }

    fs.writeFileSync('llm_comparison_gemini_claude.md', report);
    console.log('\n✅ Rapor: llm_comparison_gemini_claude.md');
}

run();
