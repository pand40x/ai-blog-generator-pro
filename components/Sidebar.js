'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', icon: '📊', label: 'Dashboard' },
        { href: '/create', icon: '✨', label: 'Yeni Yazı Oluştur' },
        { href: '/settings', icon: '⚙️', label: 'Ayarlar' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🧠</div>
                <div>
                    <h1>Blog Studio</h1>
                    <span>Klinik Psikolog</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="nav-item" style={{ cursor: 'default', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span className="nav-icon">💡</span>
                    <span>AI ile Üretim</span>
                </div>
            </div>
        </aside>
    );
}
