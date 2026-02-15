import { streamChatCompletion } from '@/lib/openrouter';

export async function POST(request) {
    try {
        const { topic, model } = await request.json();

        if (!topic) {
            return Response.json({ error: 'Konu alanı zorunludur' }, { status: 400 });
        }

        const systemPrompt = `Sen deneyimli bir Uzman Klinik Psikolog ve SEO bilgili içerik stratejistisin. 
Görevin, verilen blog konusu için okuyucuya en çok fayda sağlayacak ve SEO açısından güçlü alt başlıkları belirlemektir.

KURALLAR:
- Klinik psikoloji perspektifinden düşün
- Alt başlıkları okuyucu yolculuğuna göre sırala: Tanıma → Anlama → Başa Çıkma → Profesyonel Yardım
- Her alt başlık bir anahtar kelime veya long-tail anahtar kelime içersin
- Okuyucunun "bu yazıdan ne öğreneceğim?" sorusuna cevap verecek yapıda olsun
- 5-8 arası alt başlık öner
- Son alt başlık mutlaka "Ne Zaman Profesyonel Yardım Almalı?" veya "Sıkça Sorulan Sorular" türünde olsun
- Her alt başlık kısa ve öz olsun (max 8-10 kelime)

Yanıtını SADECE şu JSON formatında ver:
\`\`\`json
{
  "subtopics": [
    "Alt başlık 1 — kısa açıklama",
    "Alt başlık 2 — kısa açıklama"
  ],
  "suggestedKeywords": ["ana anahtar kelime", "long-tail 1", "long-tail 2", "ilişkili terim 1", "ilişkili terim 2"]
}
\`\`\`

SADECE JSON ver, başka hiçbir şey ekleme.`;

        const userPrompt = `Bu konu için alt başlıklar ve anahtar kelimeler öner:\n\n${topic}`;

        const response = await streamChatCompletion({
            model: model || 'google/gemini-2.5-flash',
            systemPrompt,
            userPrompt,
            temperature: 0.8,
            maxTokens: 1000,
        });

        // Streaming yanıtı topla (kısa cevap, stream etmeye gerek yok)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) fullText += content;
                    } catch (e) { }
                }
            }
        }

        // JSON parse
        let cleaned = fullText.trim();
        const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
        if (jsonMatch) cleaned = jsonMatch[1].trim();

        const result = JSON.parse(cleaned);
        return Response.json(result);
    } catch (error) {
        console.error('Suggest API hatası:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
