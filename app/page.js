'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      addToast('Yazılar yüklenemedi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id) {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        addToast('Yazı silindi', 'success');
      } else {
        throw new Error('Silme başarısız');
      }
    } catch (err) {
      addToast('Silinemedi: ' + err.message, 'error');
    }
    setDeleteId(null);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => (p.status || 'published') === filter);

  const totalPosts = posts.length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const publishedCount = posts.filter(p => !p.status || p.status === 'published').length;
  const totalWords = posts.reduce((sum, p) => sum + countWords(p.content), 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <div>
              <h2>Dashboard</h2>
              <p>Blog yazılarınızı yönetin ve yeni içerik üretin</p>
            </div>
            <Link href="/create" className="btn btn-primary btn-lg">
              <span>✨</span> Yeni Yazı Oluştur
            </Link>
          </div>

          {/* İstatistikler */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">📝</div>
              <div>
                <div className="stat-value">{totalPosts}</div>
                <div className="stat-label">Toplam Yazı</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div>
                <div className="stat-value">{publishedCount}</div>
                <div className="stat-label">Yayınlanmış</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">📋</div>
              <div>
                <div className="stat-value">{draftCount}</div>
                <div className="stat-label">Taslak</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📖</div>
              <div>
                <div className="stat-value">{totalWords.toLocaleString('tr-TR')}</div>
                <div className="stat-label">Toplam Kelime</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">🏷️</div>
              <div>
                <div className="stat-value">
                  {[...new Set(posts.flatMap((p) => p.tags || []))].length}
                </div>
                <div className="stat-label">Benzersiz Etiket</div>
              </div>
            </div>
          </div>

          {/* Yazı Listesi */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>
              {filter === 'all' ? 'Tüm Yazılar' : filter === 'draft' ? 'Taslaklar' : 'Yayınlanmış'}
            </h3>
            <div className="tabs" style={{ margin: 0, border: 'none' }}>
              <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                Tümü ({totalPosts})
              </button>
              <button className={`tab ${filter === 'published' ? 'active' : ''}`} onClick={() => setFilter('published')}>
                ✅ Yayın ({publishedCount})
              </button>
              <button className={`tab ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>
                📋 Taslak ({draftCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="posts-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="post-card" style={{ height: 100 }}>
                  <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '30%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Henüz blog yazısı yok</h3>
              <p>AI ile ilk blog yazınızı oluşturmak için aşağıdaki butona tıklayın</p>
              <Link href="/create" className="btn btn-primary">
                ✨ İlk Yazıyı Oluştur
              </Link>
            </div>
          ) : (
            <div className="posts-grid">
              {filteredPosts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-thumbnail">
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, background: 'var(--bg-input)',
                      }}>
                        🧠
                      </div>
                    )}
                  </div>
                  <div className="post-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="post-title">{post.title}</div>
                      <span
                        className="tag"
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          background: (!post.status || post.status === 'published')
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                          color: (!post.status || post.status === 'published')
                            ? '#10b981'
                            : '#f59e0b',
                          borderColor: (!post.status || post.status === 'published')
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        {(!post.status || post.status === 'published') ? '✅ Yayında' : '📋 Taslak'}
                      </span>
                    </div>
                    <div className="post-summary">{post.summary}</div>
                    <div className="post-meta">
                      <span className="post-date">{formatDate(post.date)}</span>
                      <div className="post-tags">
                        {(post.tags || []).slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="post-actions">
                    <Link
                      href={`/edit/${post.id}`}
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ✏️ Düzenle
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(post.id);
                      }}
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Silme Modali */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Yazıyı Sil</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Bu işlem geri alınamaz. Yazı veritabanından kalıcı olarak silinecek. Devam etmek istiyor musunuz?
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                İptal
              </button>
              <button className="btn btn-danger" onClick={() => deletePost(deleteId)}>
                🗑️ Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
