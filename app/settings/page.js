'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';

export default function Settings() {
    const { toasts, addToast, removeToast } = useToast();
    const [llmModels, setLlmModels] = useState([]);
    const [imageModels, setImageModels] = useState([]);
    const [toneOptions, setToneOptions] = useState([]);

    useEffect(() => {
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                setLlmModels(data.llmModels || []);
                setImageModels(data.imageModels || []);
                setToneOptions(data.toneOptions || []);
            })
            .catch(console.error);
    }, []);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-container">
                    <div className="page-header">
                        <div>
                            <h2>⚙️ Ayarlar</h2>
                            <p>Sistem yapılandırması ve model bilgileri</p>
                        </div>
                    </div>

                    {/* API Durumu */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-accent)' }}>
                            🔗 API Bağlantı Durumu
                        </h3>
                        {/* ... API Durumu içeriği ... */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{
                                padding: 16, borderRadius: 12,
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.15)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Supabase</span>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Veritabanı bağlantısı aktif</span>
                            </div>
                            <div style={{
                                padding: 16, borderRadius: 12,
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.15)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>OpenRouter</span>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>API bağlantısı yapılandırılmış</span>
                            </div>
                        </div>
                    </div>

                    {/* Hugging Face Token Bilgilendirmesi */}
                    <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-accent)', marginBottom: 8 }}>
                                    🔑 Hugging Face Token (Ücretsiz)
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    En iyi görsel kalitesi için Stable Diffusion XL modelini kullanın. Bunun için ücretsiz bir token gereklidir.
                                </p>
                            </div>
                            <span style={{ padding: '4px 8px', borderRadius: 6, background: '#f59e0b', color: 'white', fontSize: 11, fontWeight: 700 }}>ÖNERİLEN</span>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <a
                                href="https://huggingface.co/settings/tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '8px 16px', background: 'var(--bg-accent)', color: 'white',
                                    borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <span>Token Oluştur</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </a>
                        </div>

                        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-input)', borderRadius: 8, border: '1px dashed var(--border-subtle)' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nasıl Eklenir?</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                1. Linkten 'Read' yetkili bir token oluşturun.<br />
                                2. VS Code ile <b>.env.local</b> dosyasını açın.<br />
                                3. <b>HUGGINGFACE_API_TOKEN="..."</b> alanına yapıştırın.
                            </div>
                        </div>
                    </div>

                    {/* LLM Modelleri */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-accent)' }}>
                            🤖 Kullanılabilir LLM Modelleri
                        </h3>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {llmModels.map((model) => (
                                <div
                                    key={model.id}
                                    style={{
                                        padding: '12px 16px',
                                        background: 'var(--bg-input)',
                                        borderRadius: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        border: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {model.name}
                                        </span>
                                        <span style={{
                                            fontSize: 11, color: 'var(--text-muted)', marginLeft: 8,
                                            background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4,
                                        }}>
                                            {model.provider}
                                        </span>
                                    </div>
                                    <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{model.id}</code>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Görsel Modelleri */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-accent)' }}>
                            🖼️ Görsel Üretim Modelleri
                        </h3>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {imageModels.map((model) => (
                                <div
                                    key={model.id}
                                    style={{
                                        padding: '12px 16px',
                                        background: 'var(--bg-input)',
                                        borderRadius: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        border: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {model.name}
                                        </span>
                                        <span style={{
                                            fontSize: 11, color: 'var(--text-muted)', marginLeft: 8,
                                            background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4,
                                        }}>
                                            {model.provider}
                                        </span>
                                    </div>
                                    <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{model.id}</code>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ton Seçenekleri */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-accent)' }}>
                            🎨 Yazım Tonu Seçenekleri
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            {toneOptions.map((t) => (
                                <div
                                    key={t.value}
                                    style={{
                                        padding: 16,
                                        background: 'var(--bg-input)',
                                        borderRadius: 12,
                                        border: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {t.label}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {t.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sistem Hakkında */}
                    <div className="card" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-accent)' }}>
                            ℹ️ Sistem Bilgisi
                        </h3>
                        <div style={{ display: 'grid', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Platform</span>
                                <span style={{ color: 'var(--text-primary)' }}>Next.js + Supabase</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>AI Gateway</span>
                                <span style={{ color: 'var(--text-primary)' }}>OpenRouter</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Veritabanı</span>
                                <span style={{ color: 'var(--text-primary)' }}>PostgreSQL (Supabase)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Görsel Depolama</span>
                                <span style={{ color: 'var(--text-primary)' }}>Supabase Storage</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Varsayılan LLM</span>
                                <span style={{ color: 'var(--text-primary)' }}>Gemini 2.5 Flash</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
