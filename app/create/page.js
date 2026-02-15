'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';
import { renderMarkdown } from '@/lib/markdown';

export default function CreatePost() {
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();
    const streamRef = useRef(null);

    // Form state
    const [topic, setTopic] = useState('');
    const [subtopics, setSubtopics] = useState('');
    const [targetAudience, setTargetAudience] = useState('genel');
    const [tone, setTone] = useState('samimi');
    const [wordCount, setWordCount] = useState(1500);
    const [customInstructions, setCustomInstructions] = useState('');
    const [isSuggestingSubtopics, setIsSuggestingSubtopics] = useState(false);

    // LLM settings
    const [llmModel, setLlmModel] = useState('google/gemini-2.5-flash');
    const [customModelId, setCustomModelId] = useState('');
    const [llmModels, setLlmModels] = useState([]);
    const [toneOptions, setToneOptions] = useState([]);

    // Output state
    const [streamedText, setStreamedText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancingInstruction, setIsEnhancingInstruction] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Parse edilmiş sonuçlar
    const [parsedResult, setParsedResult] = useState({
        title: '',
        summary: '',
        tags: [],
        content: '',
    });

    const [activeTab, setActiveTab] = useState('form');

    // Ayarları yükle
    useEffect(() => {
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                setLlmModels(data.llmModels || []);
                setToneOptions(data.toneOptions || []);
            })
            .catch(console.error);
    }, []);

    // Stream çıktısını otomatik scroll
    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.scrollTop = streamRef.current.scrollHeight;
        }
    }, [streamedText]);

    function parseStreamOutput(text) {
        const result = {
            title: '',
            summary: '',
            tags: [],
            content: '',
        };

        const titleMatch = text.match(/TITLE:\s*([^\n]+)/i);
        if (titleMatch) result.title = titleMatch[1].trim();

        const summaryMatch = text.match(/SUMMARY:\s*([^\n]+)/i);
        if (summaryMatch) result.summary = summaryMatch[1].trim();

        const tagsMatch = text.match(/TAGS:\s*([^\n]+)/i);
        if (tagsMatch) {
            result.tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
        }

        const contentArg = text.split('---');
        if (contentArg.length > 1) {
            result.content = contentArg.slice(1).join('---').trim();
        } else {
            result.content = '';
        }

        return result;
    }

    async function handleSuggestSubtopics() {
        if (!topic.trim()) {
            addToast('Önce bir konu girin', 'error');
            return;
        }

        setIsSuggestingSubtopics(true);
        try {
            const res = await fetch('/api/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    model: llmModel === 'manual' ? customModelId : llmModel
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Öneri üretilemedi');

            if (data.subtopics && data.subtopics.length > 0) {
                setSubtopics(data.subtopics.join('\n'));
                addToast(`${data.subtopics.length} alt başlık önerildi!`, 'success');
            }
        } catch (err) {
            addToast('Öneri hatası: ' + err.message, 'error');
        } finally {
            setIsSuggestingSubtopics(false);
        }
    }

    // YENİ: Talimat Geliştirme
    async function handleEnhanceInstruction() {
        if (!customInstructions.trim()) {
            addToast('Lütfen geliştirilecek bir talimat yazın', 'error');
            return;
        }

        setIsEnhancingInstruction(true);
        try {
            const res = await fetch('/api/enhance-instruction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instruction: customInstructions,
                    model: llmModel === 'manual' ? customModelId : llmModel
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setCustomInstructions(data.enhancedInstruction);
            addToast('Talimat geliştirildi!', 'success');
        } catch (err) {
            addToast('Geliştirme hatası: ' + err.message, 'error');
        } finally {
            setIsEnhancingInstruction(false);
        }
    }

    async function handleGenerate() {
        if (!topic.trim()) {
            addToast('Lütfen bir konu girin', 'error');
            return;
        }

        setIsGenerating(true);
        setStreamedText('');
        setParsedResult({
            title: topic,
            summary: '',
            tags: [],
            content: '',
        });
        setActiveTab('output');

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    subtopics,
                    targetAudience,
                    tone,
                    wordCount,
                    customInstructions,
                    model: llmModel === 'manual' ? customModelId : llmModel,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Üretim başarısız');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let rawBuffer = '';

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
                            const parsedChunk = JSON.parse(data);
                            if (parsedChunk.content) {
                                rawBuffer += parsedChunk.content;
                                fullText = rawBuffer;
                                setStreamedText(fullText);

                                const currentParsed = parseStreamOutput(fullText);
                                setParsedResult(prev => ({
                                    ...prev,
                                    ...currentParsed,
                                    title: currentParsed.title || prev.title,
                                }));
                            }
                        } catch (e) { }
                    }
                }
            }
            addToast('Blog yazısı başarıyla üretildi!', 'success');
            if (fullText) setActiveTab('preview');

        } catch (err) {
            addToast('Üretim hatası: ' + err.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    }



    async function handleSave() {
        if (!parsedResult.content) {
            addToast('Kaydedilecek içerik yok', 'error');
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: parsedResult.title || topic,
                    content: parsedResult.content || '',
                    summary: parsedResult.summary || '',
                    tags: parsedResult.tags || [],
                    featured_image_url: '',
                    status: 'draft',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Kayıt başarısız');

            addToast('Taslak olarak kaydedildi!', 'success');
            setTimeout(() => router.push(`/edit/${data.post.id}`), 1500);
        } catch (err) {
            addToast('Kaydetme hatası: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    }

    const EXPERT_KEYWORDS = [
        { keywords: ['anksiyete', 'kaygı', 'panik', 'fobi', 'korku', 'endişe'], label: 'Anksiyete Bozuklukları Uzmanı', icon: '🧠', color: '#8b5cf6' },
        { keywords: ['depresyon', 'çökkünlük', 'umutsuzluk', 'mutsuzluk'], label: 'Duygudurum Bozuklukları Uzmanı', icon: '💙', color: '#3b82f6' },
        { keywords: ['travma', 'ptsd', 'taciz', 'istismar', 'şiddet', 'kayıp', 'yas'], label: 'Travma Psikoloğu', icon: '🛡️', color: '#ef4444' },
        { keywords: ['ilişki', 'evlilik', 'çift', 'partner', 'boşanma', 'bağlanma', 'aşk'], label: 'İlişki ve Çift Terapisti', icon: '💕', color: '#ec4899' },
        { keywords: ['çocuk', 'ergen', 'ebeveyn', 'anne', 'baba', 'okul', 'adhd', 'otizm'], label: 'Çocuk ve Ergen Psikoloğu', icon: '🧒', color: '#f59e0b' },
        { keywords: ['obsesyon', 'kompulsiyon', 'okb', 'takıntı', 'ritüel'], label: 'OKB Uzmanı', icon: '🔄', color: '#14b8a6' },
        { keywords: ['uyku', 'insomnia', 'uykusuzluk', 'kabus'], label: 'Uyku Psikolojisi Uzmanı', icon: '🌙', color: '#6366f1' },
        { keywords: ['stres', 'tükenmişlik', 'burnout', 'iş stresi'], label: 'İş ve Örgüt Psikoloğu', icon: '💼', color: '#f97316' },
        { keywords: ['yeme', 'anoreksiya', 'bulimia', 'obezite', 'beden', 'kilo'], label: 'Yeme Bozuklukları Uzmanı', icon: '🍃', color: '#22c55e' },
        { keywords: ['bağımlılık', 'alkol', 'madde', 'kumar', 'internet', 'sigara'], label: 'Bağımlılık Psikoloğu', icon: '⚡', color: '#a855f7' },
    ];

    function getMatchedPerspective(topicStr) {
        if (!topicStr?.trim()) return null;
        const normalized = topicStr.toLowerCase();
        let best = null;
        let bestScore = 0;
        for (const exp of EXPERT_KEYWORDS) {
            const score = exp.keywords.filter(k => normalized.includes(k)).length;
            if (score > bestScore) { bestScore = score; best = exp; }
        }
        return best;
    }

    const matchedPerspective = getMatchedPerspective(topic);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-container">
                    <div className="page-header">
                        <div>
                            <h2>✨ Yeni Blog Yazısı Oluştur</h2>
                            <p>AI ile profesyonel içerik üretimi</p>
                        </div>
                    </div>

                    <div className="tabs">
                        <button className={`tab ${activeTab === 'form' ? 'active' : ''}`} onClick={() => setActiveTab('form')}>
                            📝 Form
                        </button>
                        <button className={`tab ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>
                            📄 Çıktı {isGenerating && <span className="loading-spinner" style={{ width: 14, height: 14, marginLeft: 6 }} />}
                        </button>
                        {parsedResult.content && (
                            <button className={`tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
                                👁️ Önizleme
                            </button>
                        )}
                    </div>

                    {activeTab === 'form' && (
                        <div className="create-layout">
                            <div className="create-form-section">
                                <div className="card" style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-accent)' }}>📋 İçerik</h3>
                                    <div className="form-group">
                                        <label className="form-label">Konu</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Örn: Anksiyete"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                        />
                                    </div>
                                    {matchedPerspective && (
                                        <div style={{ display: 'flex', gap: 10, padding: 10, background: `${matchedPerspective.color}12`, borderRadius: 10, marginBottom: 16 }}>
                                            <span style={{ fontSize: 20 }}>{matchedPerspective.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: matchedPerspective.color }}>{matchedPerspective.label}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Alt Başlıklar</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={4}
                                            value={subtopics}
                                            onChange={(e) => setSubtopics(e.target.value)}
                                        />
                                        <button className="btn btn-secondary btn-sm" onClick={handleSuggestSubtopics} disabled={isSuggestingSubtopics || !topic.trim()} style={{ marginTop: 8 }}>
                                            {isSuggestingSubtopics ? '...' : 'AI ile Üret'}
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Ton</label>
                                            <select className="form-select" value={tone} onChange={(e) => setTone(e.target.value)}>
                                                {toneOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                {!toneOptions.length && <option value="samimi">Samimi</option>}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Kelime</label>
                                            <input type="number" className="form-input" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ek Talimatlar</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={2}
                                            value={customInstructions}
                                            onChange={(e) => setCustomInstructions(e.target.value)}
                                            placeholder="Örn: SEO uyumlu olsun, komik olsun, listeler kullan..."
                                        />
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleEnhanceInstruction}
                                            disabled={isEnhancingInstruction || !customInstructions.trim()}
                                            style={{ marginTop: 8 }}
                                        >
                                            {isEnhancingInstruction ? '...' : '✨ AI ile Geliştir'}
                                        </button>
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={isGenerating || !topic.trim()} style={{ width: '100%' }}>
                                    {isGenerating ? 'Üretiliyor...' : 'Blog Yazısı Üret'}
                                </button>
                            </div>
                            <div className="create-sidebar-section">
                                <div className="card">
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-accent)' }}>⚙️ Ayarlar</h3>
                                    <div className="form-group">
                                        <label className="form-label">Model (LLM)</label>
                                        <select className="form-select" value={llmModel} onChange={(e) => setLlmModel(e.target.value)}>
                                            {llmModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            {!llmModels.length && <option value="google/gemini-2.5-flash">Gemini</option>}
                                            <option value="manual">Manuel Model ID</option>
                                        </select>
                                        {llmModel === 'manual' && (
                                            <div style={{ marginTop: 10 }}>
                                                <label className="form-label" style={{ fontSize: 12 }}>Manuel Model ID</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="örn: openai/gpt-4o"
                                                    value={customModelId}
                                                    onChange={(e) => setCustomModelId(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'output' && (
                        <div>
                            <div ref={streamRef} className={`stream-output ${isGenerating ? 'streaming-cursor' : ''}`}>
                                {streamedText || <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>{isGenerating ? 'Yazılıyor...' : 'Çıktı bekleniyor...'}</div>}
                            </div>
                            {parsedResult.content && (
                                <div style={{ marginTop: 20 }}>
                                    <button className="btn btn-primary" onClick={() => setActiveTab('preview')}>Önizlemeye Git</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'preview' && parsedResult.content && (
                        <div className="preview-container">
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="meta-bar">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Başlık</label>
                                        <input type="text" className="form-input" value={parsedResult.title} onChange={(e) => setParsedResult({ ...parsedResult, title: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Özet</label>
                                    <textarea className="form-textarea" rows={2} value={parsedResult.summary} onChange={(e) => setParsedResult({ ...parsedResult, summary: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Etiketler</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {parsedResult.tags.map((tag, i) => (
                                            <span key={i} className="badge badge-secondary">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>İçerik Önizleme</h3>
                                <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(parsedResult.content) }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                                <button className="btn btn-success btn-lg" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Kaydediliyor...' : '💾 Taslak Olarak Kaydet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
