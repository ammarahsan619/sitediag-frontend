import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../App';

// ─── Hosting detection ────────────────────────────────────────────────────────
function detectHosting(checks) {
  const ns  = (checks.dns?.nameservers || []).join(' ').toLowerCase();
  const mx  = (checks.mx?.records || []).map(r => r.host).join(' ').toLowerCase();
  const ip  = (checks.dns?.ips || [])[0] || '';
  if (ns.includes('cloudflare'))                          return 'Cloudflare';
  if (ns.includes('domaincontrol') || ns.includes('godaddy')) return 'GoDaddy';
  if (ns.includes('bluehost'))                            return 'Bluehost';
  if (ns.includes('siteground'))                          return 'SiteGround';
  if (ns.includes('hostgator'))                           return 'HostGator';
  if (ns.includes('wpengine'))                            return 'WP Engine';
  if (mx.includes('google') || mx.includes('gmail'))      return 'Google Workspace';
  if (mx.includes('outlook') || mx.includes('microsoft')) return 'Microsoft 365';
  if (mx.includes('zoho'))                                return 'Zoho Mail';
  return null;
}

const HOSTING_FIXES = {
  ssl_expired: {
    'Cloudflare':  'Go to Cloudflare dashboard → SSL/TLS → Overview. SSL auto-renews for free. If stuck, toggle mode from Full to Flexible, save, then switch back.',
    'GoDaddy':     'Log in to GoDaddy → My Products → SSL Certificates → Renew. Or in cPanel: SSL/TLS → Run AutoSSL.',
    'Bluehost':    'Log in to Bluehost → Hosting → cPanel → SSL/TLS Status → Run AutoSSL.',
    'SiteGround':  'Log in to SiteGround → Site Tools → Security → SSL Manager → Install free Let\'s Encrypt.',
    'default':     'Log in to your hosting control panel (cPanel) → SSL/TLS → Run AutoSSL. Or contact your host to renew.',
  },
  dns_fail: {
    'Cloudflare':  'Check Cloudflare dashboard → DNS tab. Make sure an A record exists pointing to your server IP.',
    'GoDaddy':     'Log in to GoDaddy → DNS → verify your A record points to your server IP. Changes take up to 48 hours.',
    'default':     'Log in to your domain registrar → DNS settings → add or fix the A record pointing to your server\'s IP address.',
  },
  no_mx: {
    'Google Workspace': 'Go to your DNS provider → add MX record: ASPMX.L.GOOGLE.COM with priority 1.',
    'Microsoft 365':    'Get your MX value from Microsoft 365 Admin Center → Domains → your domain → DNS records.',
    'GoDaddy':          'Log in to GoDaddy → DNS → verify your MX record exists. If missing, add it pointing to your mail server.',
    'default':          'Log in to your DNS provider → add an MX record pointing to your mail server.',
  },
  no_spf: {
    'Google Workspace': 'v=spf1 include:_spf.google.com ~all',
    'Microsoft 365':    'v=spf1 include:spf.protection.outlook.com ~all',
    'Zoho Mail':        'v=spf1 include:zoho.com ~all',
    'default':          'v=spf1 include:YOUR-MAIL-PROVIDER ~all',
  },
  no_dmarc: {
    'default': 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
  },
  blacklisted: {
    'default': 'Visit each blacklist\'s website and submit a delisting request. Fix the root cause first (malware, open relay). Use mxtoolbox.com/blacklists.aspx to track all listings.',
  },
  http_500: {
    'Cloudflare': 'This is an origin server error behind Cloudflare. Check if your actual hosting server is running.',
    'WP Engine':  'Log in to WP Engine → check site status. Try deactivating plugins via SFTP by renaming the plugins folder.',
    'default':    'Check your server error logs. Common causes: PHP error, database connection failure, or .env misconfiguration.',
  },
};

function getFix(issue, hosting) {
  const map = HOSTING_FIXES[issue] || {};
  return map[hosting] || map['default'] || null;
}

function calcScore(checks) {
  const weights = { dns: 30, http: 25, ssl: 25, whois: 10, mx: 10 };
  let total = 0, max = 0;
  Object.entries(checks).forEach(([key, val]) => {
    const w = weights[key] || 5;
    max += w;
    if (val.status === 'ok')   total += w;
    if (val.status === 'warn') total += w * 0.5;
  });
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

function scoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function scoreLabel(score, checks) {
  const fails  = Object.values(checks).filter(c => c.status === 'fail').length;
  const warns  = Object.values(checks).filter(c => c.status === 'warn').length;
  if (fails === 0 && warns === 0) return 'All checks passed';
  if (fails > 0) return `${fails} critical issue${fails > 1 ? 's' : ''} found`;
  return `${warns} warning${warns > 1 ? 's' : ''} — action recommended`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    ok:      { bg: 'var(--green-bg)',  color: 'var(--green)',  border: 'var(--green-border)',  label: '✓ Pass'    },
    warn:    { bg: 'var(--yellow-bg)', color: 'var(--yellow)', border: 'var(--yellow-border)', label: '⚠ Warning' },
    fail:    { bg: 'var(--red-bg)',    color: 'var(--red)',    border: 'var(--red-border)',    label: '✕ Failed'  },
    loading: { bg: 'var(--bg-3)',      color: 'var(--text-3)', border: 'var(--border)',        label: '···'       },
    idle:    { bg: 'var(--bg-3)',      color: 'var(--text-3)', border: 'var(--border)',        label: '—'         },
  };
  const s = map[status] || map.idle;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 9px',
      borderRadius: 99, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
}

function CheckCard({ icon, title, status, detail, sub, fix, hosting }) {
  const borderColor = status === 'ok' ? '#16a34a' : status === 'warn' ? '#d97706' : status === 'fail' ? '#dc2626' : 'var(--border)';
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 'var(--r-lg)', padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 15 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{title}</span>
        </div>
        <StatusPill status={status} />
      </div>
      {status === 'loading' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border-2)', borderTopColor: '#ff4d1c', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Checking...</span>
        </div>
      ) : (
        <>
          {detail && <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--mono)', marginBottom: sub ? 2 : 0 }}>{detail}</p>}
          {sub    && <p style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub}</p>}
          {fix    && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', borderRadius: 'var(--r-sm)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--yellow)', marginBottom: 4 }}>
                {hosting ? `How to fix on ${hosting}` : 'How to fix'}
              </p>
              <p style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>{fix}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CopyDnsCard({ type, name, value, description }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--r-lg)', padding: '14px 16px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Missing DNS record — {description}</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {[['Type', type], ['Name', name]].map(([k, v]) => (
          <div key={k} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '3px 8px' }}>
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{k}: </span>
            <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{v}</span>
          </div>
        ))}
      </div>
      <button onClick={copy} style={{
        width: '100%', padding: '9px', border: 'none',
        background: copied ? '#16a34a' : '#111',
        color: '#fff', borderRadius: 'var(--r-md)', fontSize: 13,
        fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'background 0.15s',
      }}>
        {copied ? '✓ Copied!' : '⎘ Copy record value'}
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>Paste this into your DNS provider as a TXT record</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DiagnosticTool({ seed = '', onBack }) {
  const [tab, setTab]             = useState('website');
  const [domain, setDomain]       = useState(seed);
  const [emailInput, setEmail]    = useState('');
  const [wChecks, setWChecks]     = useState(null);
  const [eChecks, setEChecks]     = useState(null);
  const [mxRecs, setMxRecs]       = useState([]);
  const [hosting, setHosting]     = useState(null);
  const [running, setRunning]     = useState(false);
  const [smtp, setSmtp]           = useState({ host: '', port: '587', user: '', password: '', to: '' });
  const [smtpRes, setSmtpRes]     = useState(null);
  const [smtpRunning, setSmtpRun] = useState(false);

  useEffect(() => { if (seed) setTimeout(runWebsite, 400); }, []);

  async function runWebsite() {
    const d = domain.trim().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,'');
    if (!d) return;
    setRunning(true);
    setWChecks({ dns: { status: 'loading' }, http: { status: 'loading' }, ssl: { status: 'loading' }, whois: { status: 'loading' } });
    try {
      const res  = await fetch(`${BACKEND_URL}/api/website/diagnose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: d }) });
      const data = await res.json();
      const h    = detectHosting(data.checks);
      setHosting(h);
      const c    = { ...data.checks };
      if (c.ssl?.status   === 'fail') c.ssl.fix   = getFix('ssl_expired', h);
      if (c.dns?.status   === 'fail') c.dns.fix   = getFix('dns_fail', h);
      if (c.http?.detail?.includes('500')) c.http.fix = getFix('http_500', h);
      setWChecks(c);
    } catch { setWChecks({ dns: { status: 'warn', detail: 'Could not reach backend.' }, http: { status: 'idle' }, ssl: { status: 'idle' }, whois: { status: 'idle' } }); }
    setRunning(false);
  }

  async function runEmail() {
    const val = emailInput.trim();
    if (!val) return;
    setRunning(true);
    setMxRecs([]);
    setEChecks({ mx: { status: 'loading' }, spf: { status: 'loading' }, dmarc: { status: 'loading' }, dkim: { status: 'loading' }, blacklist: { status: 'loading' } });
    try {
      const body = val.includes('@') ? { email: val } : { domain: val };
      const res  = await fetch(`${BACKEND_URL}/api/email/diagnose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      const h    = detectHosting(data.checks);
      setHosting(h);
      const c    = { ...data.checks };
      if (c.mx?.status        === 'fail') c.mx.fix        = getFix('no_mx', h);
      if (c.blacklist?.status === 'fail') c.blacklist.fix = getFix('blacklisted', h);
      setEChecks(c);
      if (data.checks.mx?.records?.length) setMxRecs(data.checks.mx.records);
    } catch { setEChecks({ mx: { status: 'warn', detail: 'Could not reach backend.' } }); }
    setRunning(false);
  }

  async function runSmtp() {
    if (!smtp.host || !smtp.user || !smtp.password || !smtp.to) return;
    setSmtpRun(true); setSmtpRes(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/smtp/test`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...smtp, port: parseInt(smtp.port) }) });
      setSmtpRes(await res.json());
    } catch { setSmtpRes({ success: false, error: 'Could not reach backend server.' }); }
    setSmtpRun(false);
  }

  const score = wChecks && !Object.values(wChecks).some(c => c.status === 'loading') ? calcScore(wChecks) : null;
  const sc    = score !== null ? scoreColor(score) : '#ff4d1c';

  const inputStyle = {
    flex: 1, fontSize: 14, padding: '9px 13px',
    border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
    outline: 'none', color: 'var(--text)', background: '#fff',
    fontFamily: 'var(--sans)',
  };
  const runBtnStyle = (dis) => ({
    padding: '9px 20px', background: dis ? '#ccc' : '#ff4d1c', color: '#fff',
    border: 'none', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
    cursor: dis ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--sans)',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', height: 52, gap: 16 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
          ← Back
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, background: '#111', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 2"/>
              <circle cx="7" cy="7" r="2.5" fill="#ff4d1c"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>SiteDiag</span>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[['website','🌐','Website'], ['email','📧','Email / MX'], ['smtp','📤','SMTP Test']].map(([id, icon, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 'var(--r-md)',
              fontSize: 13, fontWeight: tab === id ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
              background: tab === id ? '#111' : '#fff',
              color: tab === id ? '#fff' : 'var(--text-2)',
              border: tab === id ? 'none' : '1px solid var(--border)',
              fontFamily: 'var(--sans)',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── Website tab ── */}
        {tab === 'website' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && runWebsite()} placeholder="Enter domain — e.g. mywebsite.com" style={inputStyle} />
              <button onClick={runWebsite} disabled={running} style={runBtnStyle(running)}>
                {running ? 'Running…' : 'Diagnose →'}
              </button>
            </div>

            {wChecks ? (
              <>
                {/* Health score */}
                {score !== null && (
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '20px 24px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg-3)" strokeWidth="5" />
                        <circle cx="36" cy="36" r="30" fill="none" stroke={sc} strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray="188.5"
                          strokeDashoffset={188.5 - (188.5 * score / 100)}
                          transform="rotate(-90 36 36)" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 20, fontWeight: 600, color: sc, fontFamily: 'var(--mono)', lineHeight: 1 }}>{score}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>/100</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{scoreLabel(score, wChecks)}</p>
                        {hosting && (
                          <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                            {hosting} detected
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        {score >= 80 ? 'Your site is healthy. No action needed.' : score >= 50 ? 'A few things need attention — see the details below.' : 'Critical issues detected. Your site may be inaccessible to visitors.'}
                      </p>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Diagnostic results</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <CheckCard icon="🔍" title="DNS resolution"  hosting={hosting} {...wChecks.dns}   />
                  <CheckCard icon="🌐" title="HTTP status"     hosting={hosting} {...wChecks.http}  />
                  <CheckCard icon="🔒" title="SSL certificate" hosting={hosting} {...wChecks.ssl}   />
                  <CheckCard icon="📅" title="Domain expiry"   hosting={hosting} {...wChecks.whois} />
                </div>

                {/* Email teaser */}
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Email security quick check</p>
                    <button onClick={() => setTab('email')} style={{ fontSize: 12, color: '#ff4d1c', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Full email check →</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                    {[['SPF','Run email check'],['DMARC','Run email check'],['DKIM','Run email check'],['Blacklist','Run email check']].map(([n]) => (
                      <div key={n} onClick={() => setTab('email')} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--bg-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{n}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Click to check</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>🌐</div>
                <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 4 }}>Enter a domain above to start</p>
                <p style={{ fontSize: 13 }}>Checks DNS, HTTP, SSL and domain expiry</p>
              </div>
            )}
          </>
        )}

        {/* ── Email tab ── */}
        {tab === 'email' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input value={emailInput} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && runEmail()} placeholder="Enter domain or email — e.g. mysite.com or me@mysite.com" style={inputStyle} />
              <button onClick={runEmail} disabled={running} style={runBtnStyle(running)}>
                {running ? 'Checking…' : 'Check →'}
              </button>
            </div>

            {eChecks ? (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Email diagnostics</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <CheckCard icon="📬" title="MX records"      hosting={hosting} {...eChecks.mx}        />
                  <CheckCard icon="🛡️" title="SPF record"      hosting={hosting} {...eChecks.spf}       />
                  <CheckCard icon="📋" title="DMARC policy"    hosting={hosting} {...eChecks.dmarc}     />
                  <CheckCard icon="🔑" title="DKIM signature"  hosting={hosting} {...eChecks.dkim}      />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <CheckCard icon="🚫" title="Blacklist check" hosting={hosting} {...(eChecks.blacklist || { status: 'idle' })} />
                </div>

                {/* Copy DNS cards for missing records */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  {eChecks.spf?.status === 'fail' && (
                    <CopyDnsCard type="TXT" name="@" value={getFix('no_spf', hosting) || 'v=spf1 include:YOUR-PROVIDER ~all'} description="SPF record missing — emails may go to spam" />
                  )}
                  {eChecks.dmarc?.status === 'fail' && (
                    <CopyDnsCard type="TXT" name="_dmarc" value={getFix('no_dmarc', hosting) || 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com'} description="DMARC record missing — domain unprotected from spoofing" />
                  )}
                </div>

                {/* MX table */}
                {mxRecs.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '64px 1fr 80px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <span>Priority</span><span>Mail server</span><span>Status</span>
                    </div>
                    {mxRecs.map((r, i) => (
                      <div key={i} style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '64px 1fr 80px', alignItems: 'center', borderBottom: i < mxRecs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{r.priority}</span>
                        <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{r.host}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', fontWeight: 500, width: 'fit-content' }}>Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>📧</div>
                <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 4 }}>Enter a domain or email address</p>
                <p style={{ fontSize: 13 }}>Checks MX, SPF, DMARC, DKIM and blacklists</p>
              </div>
            )}
          </>
        )}

        {/* ── SMTP tab ── */}
        {tab === 'smtp' && (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 24 }}>
            <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 'var(--r-md)', padding: '9px 14px', marginBottom: 18, fontSize: 12, color: 'var(--green)' }}>
              🔒 Credentials are sent only to your SMTP server — never stored or logged.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[['SMTP host','mail.yourdomain.com','host','text'],['Port','587','port','text'],['Username','you@yourdomain.com','user','text'],['Password','••••••••','password','password']].map(([label,ph,key,type]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                  <input type={type} value={smtp[key]} onChange={e => setSmtp(p => ({...p,[key]:e.target.value}))} placeholder={ph}
                    style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', color: 'var(--text)' }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Send test to</label>
              <input value={smtp.to} onChange={e => setSmtp(p => ({...p,to:e.target.value}))} placeholder="testinbox@gmail.com"
                style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', color: 'var(--text)' }} />
            </div>
            <button onClick={runSmtp} disabled={smtpRunning} style={{ width: '100%', padding: 12, background: smtpRunning ? '#ccc' : '#111', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, cursor: smtpRunning ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)' }}>
              {smtpRunning ? '⏳ Running test…' : '📤 Send test email'}
            </button>

            {smtpRes && (
              <div style={{ marginTop: 14, padding: '14px 16px', background: smtpRes.success ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${smtpRes.success ? 'var(--green-border)' : 'var(--red-border)'}`, borderRadius: 'var(--r-md)' }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: smtpRes.success ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
                  {smtpRes.success ? '✅ SMTP test passed' : '❌ SMTP test failed'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{smtpRes.summary || smtpRes.error}</p>
                {smtpRes.fix && <p style={{ fontSize: 12, marginTop: 8, color: 'var(--yellow)' }}><strong>Fix: </strong>{smtpRes.fix}</p>}
              </div>
            )}

            <div style={{ marginTop: 16, background: 'var(--bg-2)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Which port should I use?</p>
              {[['587','STARTTLS — recommended, use this first',true],['465','SSL/TLS',false],['25','Direct (usually blocked by ISPs)',false]].map(([p,d,rec]) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <code style={{ fontSize: 12, padding: '1px 7px', background: '#fff', border: '1px solid var(--border)', borderRadius: 4 }}>{p}</code>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{d}</span>
                  {rec && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>← start here</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
