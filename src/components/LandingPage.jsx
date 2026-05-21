import React, { useState, useEffect, useRef } from 'react';

const LOG_LINES = [
  { text: 'Resolving DNS records...', color: '#a8a5a0' },
  { text: 'A records → 104.21.8.1, 172.67.142.1', color: '#16a34a' },
  { text: 'Checking HTTP status...', color: '#a8a5a0' },
  { text: 'HTTP 200 OK · 138ms response time', color: '#16a34a' },
  { text: 'Checking SSL certificate...', color: '#a8a5a0' },
  { text: '⚠ SSL expires in 11 days', color: '#b45309' },
  { text: 'Querying MX records...', color: '#a8a5a0' },
  { text: 'MX → Google Workspace · 3 records', color: '#16a34a' },
  { text: 'Checking blacklists (10 RBLs)...', color: '#a8a5a0' },
  { text: 'Clean on all blacklists', color: '#16a34a' },
  { text: 'Detecting hosting provider...', color: '#a8a5a0' },
  { text: 'Cloudflare detected · tailored fixes ready', color: '#ff4d1c' },
  { text: 'Health score: 75/100 · 1 issue found', color: '#111110' },
];

function TerminalHero() {
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef();

  function runScan() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setLines([]);
    let i = 0;
    const iv = setInterval(() => {
      if (i >= LOG_LINES.length) {
        clearInterval(iv);
        setRunning(false);
        setDone(true);
        return;
      }
      setLines(l => [...l, LOG_LINES[i]]);
      i++;
      if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }, 200);
  }

  useEffect(() => { setTimeout(runScan, 600); }, []);

  return (
    <div style={{
      background: '#fafaf9',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.06)',
    }}>
      {/* Window chrome */}
      <div style={{
        background: '#f3f2ef',
        borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, background: '#fff', border: '1px solid var(--border)',
          borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>🔒</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>sitediag.app/check/example.com</span>
        </div>
      </div>

      {/* Terminal body */}
      <div ref={ref} style={{
        padding: '16px 20px',
        height: 260,
        overflowY: 'auto',
        background: '#fafaf9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            background: '#ff4d1c', color: '#fff', borderRadius: 6,
            padding: '4px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500,
          }}>
            $ sitediag scan example.com
          </div>
          {running && (
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              border: '2px solid var(--border-2)',
              borderTopColor: '#ff4d1c',
              animation: 'spin 0.6s linear infinite',
            }} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: l?.color || 'var(--text-2)', lineHeight: 1.6 }}>{l?.text || ''}</span>
            </div>
          ))}
          {running && lines.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', minWidth: 18 }}>{String(lines.length + 1).padStart(2, '0')}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', animation: 'blink 1s infinite' }}>▊</span>
            </div>
          )}
        </div>
      </div>

      {/* Result bar */}
      {done && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '2px solid #ff4d1c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ff4d1c', fontFamily: 'var(--mono)' }}>75</span>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Good — 1 issue found</p>
              <p style={{ fontSize: 11, color: 'var(--text-2)' }}>SSL expiring soon · Everything else healthy</p>
            </div>
          </div>
          <button onClick={runScan} style={{
            fontSize: 11, padding: '5px 12px', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', background: '#fff', color: 'var(--text-2)',
            cursor: 'pointer', fontFamily: 'var(--sans)',
          }}>
            Re-run
          </button>
        </div>
      )}
    </div>
  );
}

const CHECKS = [
  { icon: '🔍', name: 'DNS resolution', desc: 'Is your domain resolving to the right server?' },
  { icon: '🌐', name: 'HTTP status', desc: 'Is your server responding? What code is it returning?' },
  { icon: '🔒', name: 'SSL certificate', desc: 'Is HTTPS valid, trusted, and not expiring?' },
  { icon: '📅', name: 'Domain expiry', desc: 'When does your domain registration expire?' },
  { icon: '📬', name: 'MX records', desc: 'Where is your email being routed to?' },
  { icon: '🛡️', name: 'SPF record', desc: 'Is your domain protected against email spoofing?' },
  { icon: '📋', name: 'DMARC policy', desc: 'How strict is your email authentication policy?' },
  { icon: '🔑', name: 'DKIM signature', desc: 'Are your outgoing emails cryptographically signed?' },
  { icon: '🚫', name: 'Blacklist check', desc: 'Is your IP listed on any spam blacklists?' },
  { icon: '📤', name: 'SMTP test', desc: 'Can your mail server actually send and receive emails?' },
];

export default function LandingPage({ onLaunch }) {
  const [domain, setDomain] = useState('');

  const s = {
    nav: {
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 54,
    },
    logo: {
      display: 'flex', alignItems: 'center', gap: 8,
    },
    logoMark: {
      width: 26, height: 26, background: '#111', borderRadius: 7,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoText: {
      fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em',
    },
    navRight: { display: 'flex', alignItems: 'center', gap: 20 },
    navLink: { fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' },
    navBtn: {
      padding: '7px 16px', background: '#111', color: '#fff',
      border: 'none', borderRadius: 'var(--r-md)', fontSize: 13,
      fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)',
    },
  };

  return (
    <div>
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={s.logoMark}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 2"/>
              <circle cx="7" cy="7" r="2.5" fill="#ff4d1c"/>
            </svg>
          </div>
          <span style={s.logoText}>SiteDiag</span>
        </div>
        <div style={s.navRight}>
          <span style={s.navLink}>Pricing</span>
          <span style={s.navLink}>Docs</span>
          <button style={s.navBtn} onClick={() => onLaunch('')}>
            Free check →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 32px 80px' }}>
        <div className="a1" style={{ marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 99, padding: '4px 12px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4d1c', animation: 'pulse 2s ease infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.02em' }}>Free · No signup · Results in 15 seconds</span>
          </div>
        </div>

        <h1 className="a2" style={{
          fontSize: 'clamp(36px, 6vw, 58px)',
          fontWeight: 600, color: 'var(--text)',
          lineHeight: 1.08, letterSpacing: '-0.03em',
          marginBottom: 18,
        }}>
          Find out exactly why<br />
          your site isn't <span style={{ color: '#ff4d1c' }}>working</span>
        </h1>

        <p className="a3" style={{
          fontSize: 17, color: 'var(--text-2)', lineHeight: 1.65,
          marginBottom: 36, maxWidth: 480,
        }}>
          Enter any domain and get a plain-English diagnosis — what's broken, why it's broken, and exactly how to fix it on your hosting platform.
        </p>

        <div className="a4" style={{
          display: 'flex', gap: 8, maxWidth: 520, marginBottom: 12,
          background: '#fff', border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: 5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onLaunch(domain)}
            placeholder="Enter your domain — e.g. mywebsite.com"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, padding: '9px 12px',
              background: 'transparent', color: 'var(--text)',
              fontFamily: 'var(--sans)',
            }}
          />
          <button
            onClick={() => onLaunch(domain)}
            style={{
              padding: '10px 22px', background: '#ff4d1c', color: '#fff',
              border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--sans)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = '#e63d0e'}
            onMouseLeave={e => e.target.style.background = '#ff4d1c'}
          >
            Diagnose free →
          </button>
        </div>

        <p className="a4" style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 56 }}>
          Try: <span onClick={() => onLaunch('google.com')} style={{ color: 'var(--text-2)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>google.com</span>
          {' · '}
          <span onClick={() => onLaunch('github.com')} style={{ color: 'var(--text-2)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>github.com</span>
        </p>

        {/* Terminal hero */}
        <div className="a5">
          <TerminalHero />
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '72px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>How it works</p>
          <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: 40 }}>
            From broken to fixed in three steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {[
              { n: '01', title: 'Enter your domain', body: 'Type your website or email domain. No account, no setup.' },
              { n: '02', title: 'We scan everything', body: 'DNS, HTTP, SSL, MX records, SPF, DMARC, blacklists — all checked simultaneously.' },
              { n: '03', title: 'Get your fix', body: 'Plain-English explanation of what\'s wrong and exactly where to click in your hosting panel to fix it.' },
            ].map(s => (
              <div key={s.n} style={{
                background: '#fff', padding: '28px 28px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--bg-3)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 14, fontFamily: 'var(--mono)' }}>{s.n}</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{s.title}</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checks grid */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 32px' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>What we check</p>
        <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: 8 }}>10 checks. One diagnosis.</h2>
        <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 36 }}>Everything that could be wrong with your website or email — checked in one scan.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {CHECKS.map(c => (
            <div key={c.name} style={{
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '16px 18px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ff4d1c'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                width: 34, height: 34, background: 'var(--bg-2)',
                borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, flexShrink: 0,
              }}>{c.icon}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>{c.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#111', padding: '72px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Free. Always.</p>
        <h2 style={{ fontSize: 36, fontWeight: 600, color: '#fff', letterSpacing: '-0.025em', marginBottom: 12 }}>
          Something's wrong.<br />Find out what.
        </h2>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>No signup. No credit card. Results in 15 seconds.</p>
        <button
          onClick={() => onLaunch('')}
          style={{
            padding: '13px 30px', background: '#ff4d1c', color: '#fff',
            border: 'none', borderRadius: 'var(--r-lg)', fontSize: 15,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
          }}
          onMouseEnter={e => e.target.style.background = '#e63d0e'}
          onMouseLeave={e => e.target.style.background = '#ff4d1c'}
        >
          Run a free diagnostic →
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, background: '#111', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 2"/>
              <circle cx="7" cy="7" r="2.5" fill="#ff4d1c"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>SiteDiag</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Free website & email diagnostic tool</span>
      </div>
    </div>
  );
}
