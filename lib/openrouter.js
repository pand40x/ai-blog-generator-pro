const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Desteklenen LLM modelleri
// Desteklenen LLM modelleri
export const LLM_MODELS = [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
    { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', provider: 'Google' },
    { id: 'moonshotai/kimi-k2.5', name: 'Moonshot Kimi k2.5', provider: 'Moonshot AI' },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
];

const DEFAULT_LLM_MODEL = 'google/gemini-2.5-flash';

/**
 * OpenRouter üzerinden streaming LLM yanıtı alır
 */
export async function streamChatCompletion({ model, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 4000 }) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://blog-generator.local',
            'X-Title': 'Blog Generator',
        },
        body: JSON.stringify({
            model: model || DEFAULT_LLM_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API hatası: ${response.status} - ${error}`);
    }

    return response;
}

/**
 * OpenRouter üzerinden görsel üretir (Hibrit: Pollinations, DALL-E, Chat Completions)
 * Pollinations: Ücretsiz, API keysiz
 * DALL-E modelleri: /images/generations endpoint'i
 * Diğerleri: /chat/completions endpoint'i
 */
export async function generateImage({ prompt, model }) {
    const selectedModel = model || DEFAULT_IMAGE_MODEL;
    console.log(`[GenerateImage] İstek gönderiliyor: ${selectedModel}`);

    // SENARYO 0: Pollinations AI (Ücretsiz)
    if (selectedModel === 'pollinations') {
        // Konuyu netleştir ve prompt'u buna göre oluştur
        let cleanPrompt = '';
        const topicMatch = prompt.match(/Topic:\s*"([^"]+)"/i);

        if (topicMatch) {
            // Konu bulundu, odaklan
            const topic = topicMatch[1];
            cleanPrompt = `Blog header image about ${topic}, minimalist style, therapeutic, high quality`;
        } else {
            // Konu yoksa genel temizlik
            cleanPrompt = prompt
                .replace(/Topic:|Keywords:|Style:/gi, '')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 100);
        }

        const encodedPrompt = encodeURIComponent(cleanPrompt);

        // Random seed ekleyerek her defasında farklı görsel
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;

        console.log('[GenerateImage] Pollinations URL:', imageUrl);

        try {
            // Görseli indir ve base64 olarak döndür (backend Supabase'e yükleyecek)
            const response = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (!response.ok) throw new Error(`Pollinations fetch hatası: ${response.status}`);

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const buffer = await response.arrayBuffer();
            const base64String = Buffer.from(buffer).toString('base64');
            console.log(`[GenerateImage] Pollinations görseli indirildi (${contentType})`);

            return { b64_json: base64String, contentType };
        } catch (error) {
            console.error('[GenerateImage] Pollinations indirme hatası:', error);

            // Fallback: LoremFlickr (Anahtar kelime bazlı stok görsel)
            // Prompt içinden konuyu çekmeye çalış
            let searchTerms = 'nature,calm,psychology';

            if (topicMatch) {
                searchTerms = topicMatch[1];
            } else {
                // Yoksa ilk 2 kelimeyi al
                searchTerms = prompt.split(' ').slice(0, 2).join(',');
            }

            // Virgülle ayrılmış terimler, örn: "stress,health"
            // Cache busting için random parametre ekle
            const fallbackUrl = `https://loremflickr.com/1280/720/${encodeURIComponent(searchTerms)}/all?random=${Date.now()}`;
            console.log('[GenerateImage] Fallback LoremFlickr URL:', fallbackUrl);

            return { url: fallbackUrl };
        }
    }

    // SENARYO 1: DALL-E Modelleri (images/generations)
    if (selectedModel.includes('dall-e')) {
        console.log('[GenerateImage] DALL-E API kullanılıyor...');
        const response = await fetch(`${OPENROUTER_BASE_URL}/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://blog-generator.local',
                'X-Title': 'Blog Generator',
            },
            body: JSON.stringify({
                model: selectedModel,
                prompt,
                n: 1,
                size: '1024x1024', // DALL-E 3 varsayılan boyutu
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`[GenerateImage] DALL-E API Hatası: ${response.status}`, error);
            throw new Error(`DALL-E üretim hatası: ${response.status} - ${error}`);
        }

        const data = await response.json();
        console.log('[GenerateImage] DALL-E Yanıt:', JSON.stringify(data, null, 2));

        // DALL-E genellikle { data: [{ url: "..." }] } döner
        if (data.data && data.data.length > 0) {
            return data.data[0]; // { url: "..." } veya { b64_json: "..." }
        }

        throw new Error('DALL-E yanıtı boş döndü');
    }

    // SENARYO 2: Diğer Modeller (chat/completions + modalities)
    console.log('[GenerateImage] Chat Completions API kullanılıyor...');
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://blog-generator.local',
            'X-Title': 'Blog Generator',
        },
        body: JSON.stringify({
            model: selectedModel,
            messages: [
                { role: 'user', content: prompt },
            ],
            modalities: ['image'],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`[GenerateImage] Chat API Hatası: ${response.status}`, error);
        throw new Error(`OpenRouter görsel üretim hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('[GenerateImage] Ham Yanıt:', JSON.stringify(data, null, 2));

    // Yanıttan içerik çıkar
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        console.error('[GenerateImage] Boş içerik döndü:', data);
        throw new Error('Görsel yanıtı boş döndü (API başarılı ama içerik yok)');
    }

    console.log('[GenerateImage] Content:', content.substring(0, 200) + '...');

    // 1. data:image/... formatını bul (Base64)
    const dataUrlMatch = content.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/);
    if (dataUrlMatch) {
        console.log('[GenerateImage] Base64 data URL bulundu');
        const base64Data = dataUrlMatch[1].split(',')[1];
        return { b64_json: base64Data };
    }

    // 2. Markdown Image ![alt](url) formatını bul
    const markdownImageMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (markdownImageMatch) {
        console.log('[GenerateImage] Markdown image URL bulundu:', markdownImageMatch[1]);
        return { url: markdownImageMatch[1] };
    }

    // 3. Markdown Link [text](url) formatını bul
    const markdownLinkMatch = content.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (markdownLinkMatch) {
        console.log('[GenerateImage] Markdown link URL bulundu:', markdownLinkMatch[1]);
        return { url: markdownLinkMatch[1] };
    }

    // 4. İçerik sadece URL ise (boşluksuz)
    const cleanContent = content.trim();
    if (cleanContent.startsWith('http') && !cleanContent.includes(' ') && !cleanContent.includes('\n')) {
        console.log('[GenerateImage] Temiz URL bulundu:', cleanContent);
        return { url: cleanContent };
    }

    // 5. Metin içinde URL ara (uzantılı veya uzantısız) - En az 10 karakter uzunluğu
    const distinctUrlMatch = content.match(/(https?:\/\/[^\s"']{10,})/i);
    if (distinctUrlMatch) {
        // Eğer URL bilinen bir resim uzantısıyla bitiyorsa veya model çıktısıysa güven
        const url = distinctUrlMatch[1];
        if (url.match(/\.(png|jpg|jpeg|webp|gif)$/i) || url.includes('oaidalle') || url.includes('generated')) {
            console.log('[GenerateImage] Olası resim URL\'i bulundu:', url);
            return { url };
        }
    }

    // 6. İçerik tamamen base64 olabilir
    if (content.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(cleanContent)) {
        console.log('[GenerateImage] Raw Base64 bulundu');
        return { b64_json: cleanContent };
    }

    // Son çare: İlk bulduğun URL'yi dene
    if (distinctUrlMatch) {
        console.log('[GenerateImage] Fallback URL bulundu:', distinctUrlMatch[1]);
        return { url: distinctUrlMatch[1] };
    }

    console.error('[GenerateImage] Format tanınamadı. Content:', content);
    throw new Error('Görsel formatı tanınamadı. Lütfen farklı bir model deneyin.');
}
