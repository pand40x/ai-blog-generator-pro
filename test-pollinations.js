const prompt = "A serene lake with mountains in the background, sunset, reflection";
const cleanPrompt = prompt
    .replace(/Topic:|Keywords:|Style:/gi, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);

const encodedPrompt = encodeURIComponent(cleanPrompt);
const seed = Math.floor(Math.random() * 1000000);
const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;

console.log("Generated URL:", imageUrl);

// Fetch testi
fetch(imageUrl, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
})
    .then(async res => {
        console.log("Fetch Status:", res.status);
        const contentType = res.headers.get('content-type');
        console.log("Content-Type:", contentType);

        if (res.ok) {
            const buffer = await res.arrayBuffer();
            console.log("Buffer Size:", buffer.byteLength);
        } else {
            console.error("Fetch Failed:", await res.text());
        }
    })
    .catch(err => console.error("Fetch Error:", err));
