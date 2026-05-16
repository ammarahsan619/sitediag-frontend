import React, { useState } from 'react';

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 40px', borderBottom: '1px solid var(--border)',
    background: 'var(--white)', position: 'sticky', top: 0, zIndex: 100,
  },
  logo: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
    color: 'var(--black)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8,
  },
  logoDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block',
  },
  navBtn: {
    padding: '9px 20px', background: 'var(--black)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  hero: {
    padding: '80px 40px 60px', maxWidth: 760, margin: '0 auto', textAlign: 'center',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid #ffd4cc',
    borderRadius: 99, padding: '5px 14px', fontSize: 13, fontWeight: 500, marginBottom: 28,
  },
  h1: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(38px, 6vw, 64px)',
    lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--black)', marginBottom: 20,
  },
  accent: { color: 'var(--accent)' },
  subtitle: {
    fontSize: 18, color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px',
  },
  inputGroup: {
    display: 'flex', gap: 8, maxWidth: 560, margin: '0 auto 16px',
    background: 'var(--white)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: 6, boxShadow: 'var(--shadow-md)',
  },
  input: {
    flex: 1, border: 'none', outline: 'none', fontSize: 16, padding: '10px 14px',
    background: 'transparent', color: 'var(--black)',
  },
  launchBtn: {
    padding: '11px 24px', background: 'var(--accent)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
    transition: 'background 0.15s',
  },
  hint: { fontSize: 13, color: 'var(--gray-500)', textAlign: 'center', marginBottom: 64 },
  sectionLabel: {
    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-500)',
    marginBottom: 40, textAlign: 'center',
  },
  howSection: {
    background: 'var(--off-white)', padding: '80px 40px', borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
  },
  howGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 2, maxWidth: 900, margin: '0 auto',
  },
  howCard: {
    background: 'var(--white)', padding: '32px 28px',
    borderRadius: 0, border: '1px solid var(--border)',
  },
  howNumber: {
    fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800,
    color: 'var(--gray-200)', lineHeight: 1, marginBottom: 16,
  },
  howTitle: {
    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
    color: 'var(--black)', marginBottom: 8,
  },
  howDesc: { fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 },
  checksSection: { padding: '80px 40px', maxWidth: 900, margin: '0 auto' },
  checksTitle: {
    fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800,
    letterSpacing: '-0.02em', color: 'var(--black)', marginBottom: 8, textAlign: 'center',
  },
  checksSubtitle: { fontSize: 16, color: 'var(--gray-700)', textAlign: 'center', marginBottom: 48 },
  checksGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
  },
  checkItem: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px 20px',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  },
  checkIcon: {
    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-light)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, fontSize: 18,
  },
  checkName: { fontSize: 14, fontWeight: 500, color: 'var(--black)', marginBottom: 2 },
  checkDesc: { fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.5 },
  ctaSection: {
    background: 'var(--black)', padding: '80px 40px', textAlign: 'center',
  },
  ctaTitle: {
    fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800,
    color: 'var(--white)', marginBottom: 16, letterSpacing: '-0.02em',
  },
  ctaSubtitle: { fontSize: 17, color: 'rgba(255,255,255,0.6)', marginBottom: 36 },
  ctaBtn: {
    padding: '14px 32px', background: 'var(--accent)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius-md)', fontSize: 16, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  footer: {
    padding: '24px 40px', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  footerLogo: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--black)',
  },
  footerText: { fontSize: 13, color: 'var(--gray-500)' },
};

const CHECKS = [
  { icon: '🔍', name: 'DNS resolution', desc: 'Is your domain resolving correctly?' },
  { icon: '🌐', name: 'HTTP status', desc: 'Is the server responding? What code?' },
  { icon: '🔒', name: 'SSL certificate', desc: 'Is HTTPS valid and not expiring?' },
  { icon: '📅', name: 'Domain expiry', desc: 'When does your domain expire?' },
  { icon: '📬', name: 'MX records', desc: 'Where is your email being routed?' },
  { icon: '🛡️', name: 'SPF record', desc: 'Is your domain protected from spoofing?' },
  { icon: '📋', name: 'DMARC policy', desc: 'How strict is your email policy?' },
  { icon: '🔑', name: 'DKIM signature', desc: 'Is your email cryptographically signed?' },
  { icon: '🚫', name: 'Blacklist check', desc: 'Is your IP on any spam blacklists?' },
  { icon: '📤', name: 'SMTP test', desc: 'Can your server actually send emails?' },
];

export default function LandingPage({ onLaunch }) {
  const [domain, setDomain] = useState('');

  return (
    <div>
      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoDot} />
          SiteDiag
        </div>
        <button style={styles.navBtn} onClick={() => onLaunch('')}>
          Run a free check →
        </button>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div className="animate-1" style={styles.badge}>
          <span>⚡</span> Free diagnostic tool
        </div>

        <h1 className="animate-2" style={styles.h1}>
          Find out exactly why<br />
          your site is <span style={styles.accent}>broken</span>
        </h1>

        <p className="animate-3" style={styles.subtitle}>
          Enter your domain and get a plain-English diagnosis in seconds.
          No technical knowledge needed — just answers.
        </p>

        <div className="animate-4">
          <div style={styles.inputGroup}>
            <input
              style={styles.input}
              placeholder="Enter your domain — e.g. mywebsite.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onLaunch(domain)}
            />
            <button
              style={styles.launchBtn}
              onClick={() => onLaunch(domain)}
              onMouseEnter={e => e.target.style.background = 'var(--accent-dark)'}
              onMouseLeave={e => e.target.style.background = 'var(--accent)'}
            >
              Diagnose free →
            </button>
          </div>
          <p style={styles.hint}>No sign-up required. Results in under 15 seconds.</p>
        </div>
      </section>

      {/* How it works */}
      <section style={styles.howSection}>
        <p style={styles.sectionLabel}>How it works</p>
        <div style={styles.howGrid}>
          {[
            { n: '01', title: 'Enter your domain', desc: 'Type your website or email domain into the search bar. No account needed.' },
            { n: '02', title: 'We run the checks', desc: 'We test DNS, SSL, HTTP status, MX records, blacklists and more simultaneously.' },
            { n: '03', title: 'Get your diagnosis', desc: 'See exactly what\'s broken, why it\'s broken, and how to fix it — in plain English.' },
          ].map(s => (
            <div key={s.n} style={styles.howCard}>
              <div style={styles.howNumber}>{s.n}</div>
              <div style={styles.howTitle}>{s.title}</div>
              <p style={styles.howDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Checks */}
      <section style={styles.checksSection}>
        <p style={{ ...styles.sectionLabel, marginBottom: 16 }}>What we check</p>
        <h2 style={styles.checksTitle}>10 checks. One diagnosis.</h2>
        <p style={styles.checksSubtitle}>
          Everything that could be wrong with your website or email — checked automatically.
        </p>
        <div style={styles.checksGrid}>
          {CHECKS.map(c => (
            <div key={c.name} style={styles.checkItem}>
              <div style={styles.checkIcon}>{c.icon}</div>
              <div>
                <div style={styles.checkName}>{c.name}</div>
                <div style={styles.checkDesc}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Your site is down.<br />Find out why.</h2>
        <p style={styles.ctaSubtitle}>Free. No sign-up. Takes 15 seconds.</p>
        <button
          style={styles.ctaBtn}
          onClick={() => onLaunch('')}
          onMouseEnter={e => e.target.style.background = 'var(--accent-dark)'}
          onMouseLeave={e => e.target.style.background = 'var(--accent)'}
        >
          Run a free diagnostic →
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>SiteDiag</div>
        <div style={styles.footerText}>Free website & email diagnostic tool</div>
      </footer>
    </div>
  );
}
