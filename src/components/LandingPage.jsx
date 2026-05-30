import React, { useState, useEffect, useRef } from 'react';
import { LogoMark } from './UI';

const SCAN_LINES = [
  { t: 280,  text: '→ Resolving DNS records...',                          c: 'var(--text-3)' },
  { t: 520,  text: '✓ A records: 104.21.8.1, 172.67.142.1',              c: 'var(--ok)'     },
  { t: 760,  text: '→ Checking HTTP response...',                          c: 'var(--text-3)' },
  { t: 980,  text: '✓ HTTP 200 OK · 142ms',                              c: 'var(--ok)'     },
  { t: 1200, text: '→ Verifying SSL certificate...',                      c: 'var(--text-3)' },
  { t: 1440, text: '⚠ SSL expires in 11 days — action needed',           c: 'var(--warn)'   },
  { t: 1660, text: '→ Querying MX records...',                            c: 'var(--text-3)' },
  { t: 1880, text: '✓ MX → Google Workspace · 3 records found',          c: 'var(--ok)'     },
  { t: 2100, text: '→ Scanning SPF / DKIM / DMARC...',                   c: 'var(--text-3)' },
  { t: 2340, text: '✓ SPF valid · ✓ DKIM signed · ⚠ DMARC: none',       c: 'var(--warn)'   },
  { t: 2580, text: '→ Checking 10 blacklists...',                         c: 'var(--text-3)' },
  { t: 2820, text: '✓ Clean on all blacklists',                           c: 'var(--ok)'     },
  { t: 3060, text: '→ Detecting hosting provider...',                     c: 'var(--text-3)' },
  { t: 3280, text: '✓ Cloudflare detected · applying tailored fixes',    c: 'var(--accent)' },
  { t: 3500, text: '━━ Scan complete · Health score: 76/100 ━━',         c: 'var(--text)'   },
];

function Terminal({ onLaunchFromTerminal }) {
  const [lines, setLines]   = useState([]);
  const [done, setDone]     = useState(false);
  const [running, setRunning] = useState(false);
  const bodyRef = useRef();
  const timers  = useRef([]);

  function startScan() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLines([]);
    setDone(false);
    setRunning(true);
    SCAN_LINES.forEach(({ t, text, c }) => {
      const id = setTimeout(() => {
        setLines(prev => [...prev, { text, c }]);
        if (bodyRef.current) bodyRef.current.scrollTop = 9999;
      }, t);
      timers.current.push(id);
    });
    const endId = setTimeout(() => { setDone(true); setRunning(false); }, SCAN_LINES[SCAN_LINES.length - 1].t + 300);
    timers.current.push(endId);
  }

  useEffect(() => { startScan(); return () => timers.current.forEach(clearTimeout); }, []);

  return (
    <div style={{
      background: '#0f0f0f', border: '1px solid #222', borderRadius: 'var(--r-xl)',
      overflow: 'hidden', boxShadow: 'var(--shadow-xl), 0 0 0 1px #000',
    }}>
      {/* Chrome bar */}
      <div style={{ background: '#1a1a1a', borderBottom: '1px solid #222', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width:10,height:10,borderRadius:'50%',background:c }} />)}
        </div>
        <div style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#555' }}>🔒</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#555' }}>sitediag.app/check/example.com</span>
        </div>
      </div>

      {/* Terminal body */}
      <div ref={bodyRef} style={{ padding: '16px 20px 12px', height: 248, overflowY: 'auto', background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--r-xs)', padding: '3px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500 }}>
            $ sitediag scan example.com
          </div>
          {running && <div style={{ width:12,height:12,borderRadius:'50%',border:'2px solid #333',borderTopColor:'var(--accent)',animation:'spin 0.65s linear infinite' }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, animation: 'slideIn 0.2s ease both' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#333', minWidth: 20, flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: l.c, lineHeight: 1.7 }}>{l.text}</span>
            </div>
          ))}
          {running && <div style={{ display:'flex',gap:10 }}>
            <span style={{ fontFamily:'var(--mono)',fontSize:10,color:'#333',minWidth:20 }}>{String(lines.length+1).padStart(2,'0')}</span>
            <span style={{ fontFamily:'var(--mono)',fontSize:12,color:'#555',animation:'blink 1s infinite' }}>▊</span>
          </div>}
        </div>
      </div>

      {/* Result footer */}
      {done && (
        <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 20px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeIn 0.3s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2.5px solid var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)', lineHeight: 1 }}>76</span>
              <span style={{ fontSize: 7, color: '#555', letterSpacing: '0.05em' }}>/100</span>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#e5e5e5', marginBottom: 2 }}>Good — 2 issues need attention</p>
              <p style={{ fontSize: 11, color: '#666' }}>SSL expiring soon · DMARC policy not enforced</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={startScan} style={{ fontSize: 11, padding: '5px 11px', border: '1px solid #2a2a2a', borderRadius: 'var(--r-sm)', background: 'transparent', color: '#888', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              Re-run
            </button>
            <button onClick={() => onLaunchFromTerminal('example.com')} style={{ fontSize: 11, padding: '5px 11px', border: 'none', borderRadius: 'var(--r-sm)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500 }}>
              Full report →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CHECKS = [
  { icon: '🔍', name: 'DNS Resolution',     tooltip: 'DNS converts your domain name into a server IP address. If broken, no one can reach your site.' },
  { icon: '🌐', name: 'HTTP Status',        tooltip: 'The response your server sends when someone visits — 200 means OK, 500 means something crashed.' },
  { icon: '🔒', name: 'SSL Certificate',    tooltip: 'The security certificate that enables HTTPS. If expired, browsers show a "Not Secure" warning to visitors.' },
  { icon: '📅', name: 'Domain Expiry',      tooltip: 'When your domain registration runs out. If it expires, your site goes offline and anyone can register your name.' },
  { icon: '📬', name: 'MX Records',         tooltip: 'MX records tell the internet which server handles email for your domain. Without them, no one can email you.' },
  { icon: '🛡️', name: 'SPF Record',         tooltip: 'SPF tells email providers which servers are allowed to send on your behalf, preventing spoofing.' },
  { icon: '📋', name: 'DMARC Policy',       tooltip: 'DMARC tells servers what to do with emails that fail SPF/DKIM checks. Without it, spammers can impersonate you.' },
  { icon: '🔑', name: 'DKIM Signature',     tooltip: 'A cryptographic signature added to your outbound emails proving they really came from you.' },
  { icon: '🚫', name: 'Blacklist Check',    tooltip: 'Checks if your server IP is listed on spam databases. If listed, your emails may be blocked by recipients.' },
  { icon: '📤', name: 'SMTP Send Test',     tooltip: 'Actually sends a test email through your mail server to verify it can deliver messages successfully.' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Small business owner', text: 'Found out my emails were going to spam because of a missing SPF record. Fixed it in 5 minutes with the exact instructions provided.' },
  { name: 'James K.', role: 'Freelance developer', text: 'I use this on every client site handover now. Catches misconfigurations I would have missed for weeks.' },
  { name: 'Priya R.', role: 'E-commerce store', text: 'My SSL had expired and I had no idea. The tool caught it before my customers noticed. Saved a lot of lost sales.' },
];

export default function LandingPage({ onLaunch }) {
  const [domain, setDomain] = useState('');

  const accentStyle = { color: 'var(--accent)' };

  return (
    <div style={{ fontFamily: 'var(--font)' }}>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={26} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>SiteDiag</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {['Pricing','Docs','Blog'].map(l => (
            <span key={l} style={{ fontSize: 14, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 450 }}>{l}</span>
          ))}
          <button onClick={() => onLaunch('', 'website')} style={{
            padding: '7px 18px', background: 'var(--text)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', letterSpacing: '-0.01em',
          }}>
            Free check →
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px 72px' }}>
        <div className="anim-fade-up" style={{ marginBottom: 22 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 99, padding: '5px 14px', fontSize: 13, color: 'var(--text-2)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s ease infinite' }} />
            Free · No signup required · Results in under 15 seconds
          </span>
        </div>

        <h1 className="anim-fade-up delay-1" style={{
          fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, lineHeight: 1.07,
          letterSpacing: '-0.035em', color: 'var(--text)', marginBottom: 20,
        }}>
          Find out exactly why<br />
          your site isn't <span style={accentStyle}>working</span>
        </h1>

        <p className="anim-fade-up delay-2" style={{
          fontSize: 17, color: 'var(--text-2)', lineHeight: 1.65,
          marginBottom: 36, maxWidth: 490, fontWeight: 400,
        }}>
          Enter any domain and get a complete plain-English diagnosis — what's broken, why it's broken, and exactly how to fix it on your specific hosting platform.
        </p>

        <div className="anim-fade-up delay-3" style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', gap: 8, maxWidth: 540,
            background: 'var(--white)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-xl)', padding: 5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.07)',
            transition: 'border-color 0.2s',
          }}>
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onLaunch(domain)}
              placeholder="Enter your domain — e.g. mywebsite.com"
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 15,
                padding: '9px 12px', background: 'transparent', color: 'var(--text)',
              }}
            />
            <button
              onClick={() => onLaunch(domain)}
              style={{
                padding: '10px 22px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.target.style.background = 'var(--accent-h)'}
              onMouseLeave={e => e.target.style.background = 'var(--accent)'}
            >
              Diagnose free →
            </button>
          </div>
        </div>

        <p className="anim-fade-up delay-3" style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 60 }}>
          Try:{' '}
          {['google.com','github.com','yoursite.com'].map((d, i) => (
            <React.Fragment key={d}>
              {i > 0 && ' · '}
              <span onClick={() => onLaunch(d)} style={{ color: 'var(--text-2)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--border-2)', textUnderlineOffset: 3 }}>{d}</span>
            </React.Fragment>
          ))}
        </p>

        <div className="anim-fade-up delay-4">
          <Terminal onLaunchFromTerminal={d => onLaunch(d)} />
        </div>
      </div>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            ['10+', 'Diagnostic checks per scan'],
            ['10', 'Blacklists monitored'],
            ['< 15s', 'Average scan time'],
            ['Free', 'Always, no credit card'],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{val}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>How it works</p>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 48 }}>
          From broken to fixed in three steps
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
          {[
            { n: '01', title: 'Enter your domain', body: 'Type any domain or email address. No account needed, no personal information required.' },
            { n: '02', title: 'We run the checks', body: 'DNS, SSL, HTTP, MX records, SPF, DKIM, DMARC, blacklists — all simultaneously in seconds.' },
            { n: '03', title: 'Get your exact fix', body: 'Plain-English diagnosis with step-by-step fix instructions tailored to your specific hosting platform.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--bg-3)', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'var(--mono)', marginBottom: 16 }}>{s.n}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{s.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Checks grid ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>What we check</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em' }}>10 checks. One scan.</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Everything that could be wrong — checked automatically.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {CHECKS.map(c => (
              <div key={c.name} style={{
                background: 'var(--white)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '14px 16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.boxShadow='0 0 0 3px var(--accent-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}
                onClick={() => onLaunch('', 'website')}
              >
                <div style={{ width:34,height:34,background:'var(--bg-2)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0 }}>{c.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-3)',
                      border: '1px solid var(--border-2)', fontSize: 8, fontWeight: 700,
                      color: 'var(--text-3)', cursor: 'help', marginLeft: 5,
                    }} title={c.tooltip}>?</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 2 }}>{c.tooltip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>What users say</p>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 40 }}>Real problems, actually fixed</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.65, marginBottom: 16, fontStyle: 'italic' }}>"{t.text}"</p>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--text)', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Free. No signup. Always.</p>
        <h2 style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.08 }}>
          Something's broken.<br />Find out what.
        </h2>
        <p style={{ fontSize: 16, color: '#777', marginBottom: 36 }}>Instant diagnosis. Plain-English results. Exact fix instructions.</p>
        <button
          onClick={() => onLaunch('', 'website')}
          style={{
            padding: '13px 32px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-lg)', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '-0.01em', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.target.style.background = 'var(--accent-h)'}
          onMouseLeave={e => e.target.style.background = 'var(--accent)'}
        >
          Run a free diagnostic →
        </button>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={20} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>SiteDiag</span>
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Free website & email diagnostic tool · No signup required</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy','Terms','Contact'].map(l => (
            <span key={l} style={{ fontSize: 13, color: 'var(--text-3)', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
