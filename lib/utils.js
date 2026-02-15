/**
 * Türkçe karakterleri destekleyen slug üretici
 */
export function generateSlug(title) {
    const turkishMap = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
    };

    return title
        .split('')
        .map(char => turkishMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

/**
 * Tarih formatlayıcı (Türkçe)
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Kelime sayacı
 */
export function countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Özeti kısalt (SEO için max 160 karakter)
 */
export function truncateSummary(text, maxLength = 160) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * LLM yanıtından JSON parse et (code block içindeyse çıkar)
 */
export function parseJsonResponse(text) {
    // ```json ... ``` formatını temizle
    let cleaned = text.trim();

    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Eğer JSON parse başarısızsa, düz metin olarak döndür
        return {
            title: 'Başlıksız Yazı',
            summary: '',
            tags: [],
            meta_description: '',
            content: text,
        };
    }
}

/**
 * Okuma süresi hesapla (ortalama 200 kelime/dakika)
 */
export function calculateReadTime(text) {
    const words = countWords(text);
    const minutes = Math.ceil(words / 200);
    return `${minutes} dk okuma`;
}
