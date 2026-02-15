/**
 * Gelişmiş Markdown → HTML Renderer
 * Raw markdown metnini düzgün HTML'e dönüştürür.
 * \n karakterlerini doğru işler, başlık/liste/bold/italic vb. destekler.
 */
export function renderMarkdown(text) {
    if (!text) return '';

    // Literal \n karakterlerini gerçek satır sonlarına çevir
    let html = text.replace(/\\n/g, '\n');

    // Code blocks (```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="code-block"><code>${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });

    // Satır satır işle
    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;
    let listType = null; // 'ul' veya 'ol'

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Başlıklar
        if (line.match(/^### (.+)/)) {
            if (inList) { processedLines.push(`</${listType}>`); inList = false; }
            processedLines.push(`<h3>${line.replace(/^### /, '')}</h3>`);
            continue;
        }
        if (line.match(/^## (.+)/)) {
            if (inList) { processedLines.push(`</${listType}>`); inList = false; }
            processedLines.push(`<h2>${line.replace(/^## /, '')}</h2>`);
            continue;
        }
        if (line.match(/^# (.+)/)) {
            if (inList) { processedLines.push(`</${listType}>`); inList = false; }
            processedLines.push(`<h1>${line.replace(/^# /, '')}</h1>`);
            continue;
        }

        // Sırasız liste
        if (line.match(/^[\-\*] (.+)/)) {
            if (!inList || listType !== 'ul') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            processedLines.push(`<li>${applyInlineFormatting(line.replace(/^[\-\*] /, ''))}</li>`);
            continue;
        }

        // Sıralı liste
        if (line.match(/^\d+\. (.+)/)) {
            if (!inList || listType !== 'ol') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            processedLines.push(`<li>${applyInlineFormatting(line.replace(/^\d+\. /, ''))}</li>`);
            continue;
        }

        // Liste dışına çıkma
        if (inList && line.trim() === '') {
            processedLines.push(`</${listType}>`);
            inList = false;
            continue;
        }
        if (inList && !line.match(/^[\-\*] /) && !line.match(/^\d+\. /)) {
            processedLines.push(`</${listType}>`);
            inList = false;
        }

        // Blockquote
        if (line.match(/^> (.+)/)) {
            processedLines.push(`<blockquote>${applyInlineFormatting(line.replace(/^> /, ''))}</blockquote>`);
            continue;
        }

        // Yatay çizgi
        if (line.match(/^---+$/)) {
            processedLines.push('<hr>');
            continue;
        }

        // Boş satır → paragraf ayırıcı
        if (line.trim() === '') {
            processedLines.push('</p><p>');
            continue;
        }

        // Normal metin
        processedLines.push(applyInlineFormatting(line));
    }

    if (inList) {
        processedLines.push(`</${listType}>`);
    }

    html = '<p>' + processedLines.join('\n') + '</p>';

    // Boş paragrafları temizle
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<(h[1-3]|ul|ol|blockquote|hr|pre)/g, '<$1');
    html = html.replace(/<\/(h[1-3]|ul|ol|blockquote|pre)>\s*<\/p>/g, '</$1>');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
}

/**
 * Satır içi (inline) formatlama uygular
 */
function applyInlineFormatting(text) {
    return text
        // Görsel: ![alt](url)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0;">')
        // Link: [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--text-accent)">$1</a>')
        // Bold + Italic: ***text***
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        // Bold: **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic: *text*
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Inline code: `code`
        .replace(/`([^`]+)`/g, '<code style="background:rgba(139,92,246,0.1);padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');
}
