'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';
import { renderMarkdown } from '@/lib/markdown';

export default function EditPost() {
    const router = useRouter();
    const params = useParams();
    const { toasts, addToast, removeToast } = useToast();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Editable fields
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [customImagePrompt, setCustomImagePrompt] = useState(''); // Yeni: Özel tarif
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageModel, setImageModel] = useState('pollinations');
    const [imageModels, setImageModels] = useState([]);

    // View mode
    const [viewMode, setViewMode] = useState('split'); // edit, preview, split

    useEffect(() => {
        fetchPost();
        // Modelleri yükle
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setImageModels(data.imageModels || []);
                // Varsayılan model seçimi (Eğer kullanıcı daha önce seçmediyse)
                // İdealde post.image_model veritabanında saklanmalı ama şimdilik varsayılanı alalım
                if (data.imageModels?.length > 0) {
                    setImageModel(data.imageModels[0].id);
                }
            })
            .catch(console.error);
    }, []);

    async function fetchPost() {
        try {
            const res = await fetch(`/api/posts/${params.id}`);
            const data = await res.json();
            if (data.post) {
                setPost(data.post);
                setTitle(data.post.title || '');
                setSummary(data.post.summary || '');
                setContent(data.post.content || '');
                setTags((data.post.tags || []).join(', '));
                setImageUrl(data.post.featured_image_url || '');
            }
        } catch (err) {
            addToast('Yazı yüklenemedi: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch(`/api/posts/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    summary,
                    tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                    featured_image_url: imageUrl,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Kaydetme başarısız');
            }

            addToast('Yazı başarıyla güncellendi!', 'success');
        } catch (err) {
            addToast('Güncelleme hatası: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    }

    async function togglePublish() {
        const newStatus = (post.status === 'published') ? 'draft' : 'published';
        setPublishing(true);
        try {
            const res = await fetch(`/api/posts/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Durum değiştirilemedi');
            }
            setPost({ ...post, status: newStatus });
            addToast(
                newStatus === 'published'
                    ? '✅ Yazı yayınlandı!'
                    : '📋 Yazı taslağa alındı.',
                'success'
            );
        } catch (err) {
            addToast('Hata: ' + err.message, 'error');
        } finally {
            setPublishing(false);
        }
    }

    async function handleGenerateImage() {
        setIsGeneratingImage(true);
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    summary,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    model: imageModel,
                    customPrompt: customImagePrompt, // Özel prompt
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Görsel üretilemedi');
            setImageUrl(data.imageUrl);
            addToast('Kapak görseli başarıyla oluşturuldu!', 'success');
        } catch (err) {
            addToast('Görsel hatası: ' + err.message, 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    }

    function countWords(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    }

    if (loading) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <div className="page-container">
                        <div style={{ textAlign: 'center', padding: '100px 0' }}>
                            <span className="loading-spinner" style={{ width: 40, height: 40 }} />
                            <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Yazı yükleniyor...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <div className="page-container">
                        <div className="empty-state">
                            <div className="empty-icon">❌</div>
                            <h3>Yazı bulunamadı</h3>
                            <button className="btn btn-primary" onClick={() => router.push('/')}>
                                ← Dashboard'a Dön
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-container">
                    {/* Toolbar */}
                    <div className="toolbar">
                        <div className="toolbar-left">
                            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/')}>
                                ← Geri
                            </button>
                            <span
                                style={{
                                    fontSize: 11,
                                    padding: '3px 10px',
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    background: (!post.status || post.status === 'published')
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                    color: (!post.status || post.status === 'published')
                                        ? '#10b981'
                                        : '#f59e0b',
                                }}
                            >
                                {(!post.status || post.status === 'published') ? '✅ Yayında' : '📋 Taslak'}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                {countWords(content)} kelime
                            </span>
                        </div>
                        <div className="toolbar-right">
                            <div className="tabs" style={{ margin: 0, border: 'none' }}>
                                <button
                                    className={`tab ${viewMode === 'edit' ? 'active' : ''}`}
                                    onClick={() => setViewMode('edit')}
                                >
                                    ✏️ Düzenle
                                </button>
                                <button
                                    className={`tab ${viewMode === 'split' ? 'active' : ''}`}
                                    onClick={() => setViewMode('split')}
                                >
                                    📐 Bölünmüş
                                </button>
                                <button
                                    className={`tab ${viewMode === 'preview' ? 'active' : ''}`}
                                    onClick={() => setViewMode('preview')}
                                >
                                    👁️ Önizleme
                                </button>
                            </div>
                            <button
                                className="btn btn-success"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Kaydediliyor...</>
                                ) : (
                                    <>💾 Kaydet</>
                                )}
                            </button>
                            <button
                                className={`btn ${(!post.status || post.status === 'published') ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={togglePublish}
                                disabled={publishing}
                            >
                                {publishing ? (
                                    <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> ...</>
                                ) : (!post.status || post.status === 'published') ? (
                                    <>📋 Taslağa Al</>
                                ) : (
                                    <>🚀 Yayınla</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Meta Alanları */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="meta-bar">
                            <div className="form-group">
                                <label className="form-label">Başlık</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Etiketler (Virgülle ayırın)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label className="form-label">Özet</label>
                            <textarea
                                className="form-textarea"
                                rows={2}
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                            />
                        </div>

                        {/* Gelişmiş Görsel Üretim Alanı */}
                        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-accent)' }}>🖼️ Kapak Görseli Yönetimi</h4>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                                <div>
                                    <label className="form-label" style={{ fontSize: 12 }}>Model Seçimi</label>
                                    <select
                                        className="form-select"
                                        value={imageModel}
                                        onChange={e => setImageModel(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        {(imageModels.length > 0 ? imageModels : [
                                            { id: 'huggingface', name: 'Hasas (Stable Diffusion XL)', provider: 'Hugging Face' }
                                        ]).map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: 12 }}>Özel Tarif (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Örn: Mavi gökyüzü altında koşan atlar..."
                                        value={customImagePrompt}
                                        onChange={(e) => setCustomImagePrompt(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage}
                                    style={{ flex: 1 }}
                                >
                                    {isGeneratingImage ? (
                                        <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Üretiliyor...</>
                                    ) : (
                                        <>✨ {imageUrl ? 'Yeniden Oluştur' : 'Görsel Oluştur'}</>
                                    )}
                                </button>
                                {imageUrl && (
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => setImageUrl('')}
                                        style={{ color: 'var(--text-error)' }}
                                    >
                                        Kaldır
                                    </button>
                                )}
                            </div>

                            {imageUrl ? (
                                <div style={{ marginTop: 16, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                    <img
                                        src={imageUrl}
                                        alt="Kapak"
                                        style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
                                    />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 11, backdropFilter: 'blur(4px)' }}>
                                        Bağlantı: <a href={imageUrl} target="_blank" style={{ color: 'white', textDecoration: 'underline' }}>Görseli Aç</a>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 12 }}>
                                    <label className="form-label" style={{ fontSize: 12 }}>Veya Görsel URL'i Yapıştırın</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="https://..."
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className={viewMode === 'split' ? 'editor-layout' : ''}>
                        {(viewMode === 'edit' || viewMode === 'split') && (
                            <div className="editor-panel">
                                <div className="panel-header">
                                    <span className="panel-title">Markdown Editör</span>
                                </div>
                                <textarea
                                    className="editor-textarea"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Blog içeriğinizi buraya yazın..."
                                />
                            </div>
                        )}

                        {(viewMode === 'preview' || viewMode === 'split') && (
                            <div className="preview-panel">
                                <div className="panel-header">
                                    <span className="panel-title">Canlı Önizleme</span>
                                </div>
                                <div
                                    className="preview-content"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
