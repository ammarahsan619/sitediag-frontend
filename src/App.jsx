import React, { useState } from 'react';
import WebsiteChecker from './components/WebsiteChecker';
import EmailChecker from './components/EmailChecker';
import SmtpTester from './components/SmtpTester';

// ─── IMPORTANT ───────────────────────────────────────────────────────────────
// After you deploy your backend to Render.com, replace the URL below
// with your actual Render backend URL. Example:
// https://sitediag-backend.onrender.com
// ─────────────────────────────────────────────────────────────────────────────
export const BACKEND_URL = 'https://sitediag-backend-production.up.railway.app';;

const TABS = [
  { id: 'website', label: '🌐 Website', desc: 'Check why your site is down' },
  { id: 'email',   label: '📧 Email / MX', desc: 'Check email & DNS records' },
  { id: 'smtp',    label: '📤 SMTP Test', desc: 'Test if email sending works' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('website');

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56 }}>
          <span style={{ fontWeight: 600, fontSize: 18, color: '#111' }}>⚡ SiteDiag</span>
          <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--gray)', borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
            Website & Email Diagnostics
          </span>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '32px 24px 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 6 }}>
            Find out why your website or email isn't working
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 15, marginBottom: 24 }}>
            Enter your domain and get a plain-English diagnosis — no technical knowledge needed.
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  background: activeTab === tab.id ? '#f9fafb' : 'transparent',
                  color: activeTab === tab.id ? '#111' : 'var(--gray)',
                  borderTop: activeTab === tab.id ? '2px solid #111' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px' }}>
        {activeTab === 'website' && <WebsiteChecker />}
        {activeTab === 'email'   && <EmailChecker />}
        {activeTab === 'smtp'    && <SmtpTester />}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', color: 'var(--gray)', fontSize: 13 }}>
        SiteDiag — Free website & email diagnostic tool
      </footer>
    </div>
  );
}
