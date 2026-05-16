import React, { useState } from 'react';
import { BACKEND_URL } from '../App';

// ─── Hosting detection ───────────────────────────────────────────────────────
function detectHosting(checks) {
  const mx = checks.mx?.records?.[0]?.host?.toLowerCase() || '';
  const ns = checks.dns?.nameservers?.join(' ').toLowerCase() || '';
  const ip = checks.dns?.ips?.[0] || '';
  const httpDetail = checks.http?.detail?.toLowerCase() || '';

  if (ns.includes('cloudflare') || httpDetail.includes('cloudflare')) return 'cloudflare';
  if (ns.includes('wpengine') || mx.includes('wpengine')) return 'wpengine';
  if (ns.includes('godaddy') || ns.includes('domaincontrol')) return 'godaddy';
  if (ns.includes('bluehost')) return 'bluehost';
  if (ns.includes('hostgator')) return 'hostgator';
  if (ns.includes('siteground')) return 'siteground';
  if (mx.includes('google') || mx.includes('gmail')) return 'google';
  if (mx.includes('outlook') || mx.includes('microsoft')) return 'microsoft';
  if (mx.includes('zoho')) return 'zoho';
  if (ns.includes('digitalocean')) return 'digitalocean';
  return 'generic';
}

function getHostingFix(issue, hosting) {
  const fixes = {
    ssl_expired: {
      cloudflare: 'Go to Cloudflare dashboard → SSL/TLS → Overview → switch to "Full (strict)". Cloudflare auto-renews SSL for free.',
      godaddy: 'Log in to GoDaddy → My Products → SSL Certificates → click Renew. Or use GoDaddy cPanel → SSL/TLS → Run AutoSSL.',
      bluehost: 'Log in to Bluehost → Hosting → cPanel → SSL/TLS Status → click "Run AutoSSL".',
      siteground: 'Log in to SiteGround → Site Tools → Security → SSL Manager → install Let\'s Encrypt.',
      generic: 'Log in to your hosting control panel (cPanel) → SSL/TLS → Run AutoSSL. Or contact your host to renew.',
    },
    dns_fail: {
      cloudflare: 'Your domain\'s nameservers should point to Cloudflare. Check Cloudflare dashboard → DNS tab and verify your A record exists.',
      godaddy: 'Log in to GoDaddy → DNS → verify your A record points to your server IP. Changes take up to 48hrs.',
      generic: 'Log in to your domain registrar → DNS settings → add/fix the A record pointing to your server\'s IP address.',
    },
    no_mx: {
      google: 'Add Google Workspace MX records: go to your DNS provider → add MX record → value: ASPMX.L.GOOGLE.COM, priority 1.',
      microsoft: 'Add Microsoft 365 MX record in your DNS provider. Get the exact value from Microsoft 365 admin center → Domains.',
      godaddy: 'Log in to GoDaddy → DNS → add MX record. If using GoDaddy Email, the MX record should already exist — check it\'s not deleted.',
      generic: 'Log in to your DNS provider → add an MX record pointing to your mail server. Contact your email provider for the exact value.',
    },
    no_spf: {
      google: 'Add TXT record: v=spf1 include:_spf.google.com ~all',
      microsoft: 'Add TXT record: v=spf1 include:spf.protection.outlook.com ~all',
      zoho: 'Add TXT record: v=spf1 include:zoho.com ~all',
      generic: 'Add a TXT record to your DNS: v=spf1 include:YOUR-MAIL-PROVIDER ~all. Ask your email provider for their SPF include value.',
    },
    no_dmarc: {
      generic: 'Add a TXT record: Name = _dmarc, Value = v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
    },
    blacklisted: {
      generic: 'Go to each blacklist\'s removal page and request delisting. Fix the root cause first (clean up malware, secure your mail server). Use mxtoolbox.com/blacklists.aspx to track all listings.',
    },
    http_500: {
      cloudflare: 'This is a Cloudflare 5xx error — your origin server is down. Check if your hosting server (behind Cloudflare) is running.',
      wpengine: 'Log in to WP Engine dashboard → check site status. Try deactivating plugins via wp-config or contact WP Engine support.',
      generic: 'Check your server error logs. Most common causes: PHP error, database connection failed, or memory limit exceeded. Check wp-content/debug.log if WordPress.',
    },
  };

  const issueFixes = fixes[issue] || {};
  return issueFixes[hosting] || issueFixes['generic'] || null;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  wrap: { minHeight: '100vh', background: 'var(--off-white)' },
  topBar: {
    background: 'var(--white)', borderBottom: '1px solid var(--border)',
    padding: '0 32px', display: 'flex', alignItems: 'center',
    height: 56, gap: 16,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6, background: 'none',
    border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--gray-700)',
    padding: '6px 0', fontFamily: 'var(--font-body)',
  },
  logo: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
    color: 'var(--black)', marginLeft: 8,
  },
  main: { maxWidth: 800, margin: '0 auto', padding: '32px 24px' },
  searchBox: {
    background: 'var(--white)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', padding: '8px 8px 8px 20px',
    display: 'flex', alignItems: 'center', gap: 8,
    boxShadow: 'var(--shadow-md)', marginBottom: 28,
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', fontSize: 16,
    color: 'var(--black)', background: 'transparent',
  },
  runBtn: {
    padding: '11px 24px', background: 'var(--accent)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  },
  tabRow: { display: 'flex', gap: 4, marginBottom: 24 },
  tab: (active) => ({
    padding: '8px 18px', border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: 14, fontWeight: active ? 600 : 400, cursor: 'pointer',
    background: active ? 'var(--black)' : 'transparent',
    color: active ? 'var(--white)' : 'var(--gray-700)',
    fontFamily: 'var(--font-body)', transition: 'all 0.15s',
  }),
  sectionTitle: {
    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--gray-500)', marginBottom: 12,
  },
  cardsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 },
  card: (status) => ({
    background: 'var(--white)', border: `1px solid ${status === 'fail' ? '#fca5a5' : status === 'warn' ? '#fde68a' : 'var(--border)'}`,
    borderRadius: 'var(--radius-lg)', padding: '16px 18px',
    borderLeft: `3px solid ${status === 'ok' ? '#16a34a' : status === 'fail' ? '#dc2626' : status === 'warn' ? '#d97706' : 'var(--gray-300)'}`,
  }),
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: 'var(--black)', display: 'flex', alignItems: 'center', gap: 6 },
  badge: (status) => ({
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
    background: status === 'ok' ? 'var(--green-bg)' : status === 'fail' ? 'var(--red-bg)' : status === 'warn' ? 'var(--yellow-bg)' : 'var(--gray-100)',
    color: status === 'ok' ? 'var(--green)' : status === 'fail' ? 'var(--red)' : status === 'warn' ? 'var(--yellow)' : 'var(--gray-500)',
  }),
  cardDetail: { fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 },
  fixBox: {
    marginTop: 10, padding: '10px 12px',
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#92400e', lineHeight: 1.6,
  },
  spinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid var(--gray-200)', borderTopColor: 'var(--gray-500)',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  emptyState: {
    textAlign: 'center', padding: '60px 24px', color: 'var(--gray-500)',
  },
  mxTable: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 10,
  },
  mxHead: {
    display: 'grid', gridTemplateColumns: '70px 1fr 90px',
    padding: '8px 14px', background: 'var(--gray-100)',
    borderBottom: '1px solid var(--border)',
    fontSize: 11, fontWeight: 600, color: 'var(--gray-500)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  mxRow: {
    display: 'grid', gridTemplateColumns: '70px 1fr 90px',
    padding: '10px 14px', borderBottom: '1px solid var(--border)',
    fontSize: 13, alignItems: 'center',
  },
  smtpWrap: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: 24,
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--gray-700)' },
  fieldInput: {
    padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    fontSize: 14, outline: 'none', color: 'var(--black)', fontFamily: 'var(--font-body)',
  },
  smtpBtn: {
    width: '100%', padding: 13, background: 'var(--black)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginTop: 4, fontFamily: 'var(--font-body)',
  },
  hostingTag: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'var(--gray-100)', border: '1px solid var(--border)',
    borderRadius: 99, padding: '3px 10px', fontSize: 12,
    color: 'var(--gray-700)', marginBottom: 16,
  },
};

function StatusBadge({ status }) {
  const labels = { ok: '✓ Pass', warn: '⚠ Warning', fail: '✕ Failed', loading: '…', idle: '—', error: '✕ Error' };
  return <span style={s.badge(status)}>{labels[status] || '—'}</span>;
}

function CheckCard({ icon, title, status, detail, fix }) {
  return (
    <div style={s.card(status)}>
      <div style={s.cardHead}>
        <div style={s.cardTitle}><span>{icon}</span>{title}</div>
        <StatusBadge status={status} />
      </div>
      {status === 'loading'
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={s.spinner} /><span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Checking...</span></div>
        : detail && <p style={s.cardDetail}>{detail}</p>
      }
      {fix && <div style={s.fixBox}><strong>How to fix: </strong>{fix}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DiagnosticTool({ initialDomain = '', onBack }) {
  const [tab, setTab] = useState('website');
  const [domain, setDomain] = useState(initialDomain);
  const [emailInput, setEmailInput] = useState('');
  const [websiteChecks, setWebsiteChecks] = useState(null);
  const [emailChecks, setEmailChecks] = useState(null);
  const [mxRecords, setMxRecords] = useState([]);
  const [hosting, setHosting] = useState('generic');
  const [running, setRunning] = useState(false);
  const [smtp, setSmtp] = useState({ host: '', port: '587', user: '', password: '', to: '' });
  const [smtpResult, setSmtpResult] = useState(null);
  const [smtpRunning, setSmtpRunning] = useState(false);

  async function runWebsite() {
    const d = domain.trim().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,'');
    if (!d) return;
    setRunning(true);
    setWebsiteChecks({ dns: { status: 'loading' }, http: { status: 'loading' }, ssl: { status: 'loading' }, whois: { status: 'loading' } });

    try {
      const res = await fetch(`${BACKEND_URL}/api/website/diagnose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      });
      const data = await res.json();
      const h = detectHosting(data.checks);
      setHosting(h);

      // Inject hosting-aware fixes
      const checks = { ...data.checks };
      if (checks.ssl?.status === 'fail') checks.ssl.fix = getHostingFix('ssl_expired', h) || checks.ssl.fix;
      if (checks.dns?.status === 'fail') checks.dns.fix = getHostingFix('dns_fail', h) || checks.dns.fix;
      if (checks.http?.detail?.includes('500')) checks.http.fix = getHostingFix('http_500', h) || checks.http.fix;

      setWebsiteChecks(checks);
    } catch {
      setWebsiteChecks({ dns: { status: 'warn', detail: 'Could not reach diagnostic server.' }, http: { status: 'idle' }, ssl: { status: 'idle' }, whois: { status: 'idle' } });
    }
    setRunning(false);
  }

  async function runEmail() {
    const val = emailInput.trim();
    if (!val) return;
    setRunning(true);
    setMxRecords([]);
    setEmailChecks({ mx: { status: 'loading' }, spf: { status: 'loading' }, dmarc: { status: 'loading' }, dkim: { status: 'loading' }, blacklist: { status: 'loading' } });

    try {
      const body = val.includes('@') ? { email: val } : { domain: val };
      const res = await fetch(`${BACKEND_URL}/api/email/diagnose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const h = detectHosting(data.checks);
      setHosting(h);

      const checks = { ...data.checks };
      if (checks.mx?.status === 'fail') checks.mx.fix = getHostingFix('no_mx', h) || checks.mx.fix;
      if (checks.spf?.status === 'fail') checks.spf.fix = getHostingFix('no_spf', h) || checks.spf.fix;
      if (checks.dmarc?.status === 'fail') checks.dmarc.fix = getHostingFix('no_dmarc', h) || checks.dmarc.fix;
      if (checks.blacklist?.status === 'fail') checks.blacklist.fix = getHostingFix('blacklisted', h) || checks.blacklist.fix;

      setEmailChecks(checks);
      if (data.checks.mx?.records?.length > 0) setMxRecords(data.checks.mx.records);
    } catch {
      setEmailChecks({ mx: { status: 'warn', detail: 'Could not reach diagnostic server.' } });
    }
    setRunning(false);
  }

  async function runSmtp() {
    if (!smtp.host || !smtp.user || !smtp.password || !smtp.to) return;
    setSmtpRunning(true);
    setSmtpResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/smtp/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...smtp, port: parseInt(smtp.port) }),
      });
      setSmtpResult(await res.json());
    } catch {
      setSmtpResult({ success: false, error: 'Could not reach backend server.' });
    }
    setSmtpRunning(false);
  }

  const hostingLabel = hosting !== 'generic' ? hosting.charAt(0).toUpperCase() + hosting.slice(1) : null;

  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <div style={s.logo}>SiteDiag</div>
      </div>

      <div style={s.main}>
        {/* Tab row */}
        <div style={s.tabRow}>
          {[['website','🌐 Website'],['email','📧 Email / MX'],['smtp','📤 SMTP Test']].map(([id, label]) => (
            <button key={id} style={s.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* Website tab */}
        {tab === 'website' && (
          <>
            <div style={s.searchBox}>
              <input
                style={s.searchInput}
                placeholder="Enter domain — e.g. mywebsite.com"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runWebsite()}
              />
              <button style={{ ...s.runBtn, opacity: running ? 0.6 : 1 }} onClick={runWebsite} disabled={running}>
                {running ? 'Running…' : 'Diagnose →'}
              </button>
            </div>

            {hostingLabel && websiteChecks && (
              <div style={s.hostingTag}>🏠 Detected: {hostingLabel}</div>
            )}

            {websiteChecks ? (
              <>
                <p style={s.sectionTitle}>Diagnostic results</p>
                <div style={s.cardsGrid}>
                  <CheckCard icon="🔍" title="DNS resolution" {...websiteChecks.dns} />
                  <CheckCard icon="🌐" title="HTTP status" {...websiteChecks.http} />
                  <CheckCard icon="🔒" title="SSL certificate" {...websiteChecks.ssl} />
                  <CheckCard icon="📅" title="Domain expiry" {...websiteChecks.whois} />
                </div>
              </>
            ) : (
              <div style={s.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>🌐</div>
                <p style={{ fontSize: 15 }}>Enter a domain above to run a full diagnosis</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>Checks DNS, HTTP, SSL, and domain expiry</p>
              </div>
            )}
          </>
        )}

        {/* Email tab */}
        {tab === 'email' && (
          <>
            <div style={s.searchBox}>
              <input
                style={s.searchInput}
                placeholder="Enter domain or email — e.g. mysite.com or me@mysite.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runEmail()}
              />
              <button style={{ ...s.runBtn, opacity: running ? 0.6 : 1 }} onClick={runEmail} disabled={running}>
                {running ? 'Checking…' : 'Check →'}
              </button>
            </div>

            {hostingLabel && emailChecks && (
              <div style={s.hostingTag}>📬 Provider: {hostingLabel}</div>
            )}

            {emailChecks ? (
              <>
                <p style={s.sectionTitle}>Email diagnostics</p>
                <div style={s.cardsGrid}>
                  <CheckCard icon="📬" title="MX records" {...emailChecks.mx} />
                  <CheckCard icon="🛡️" title="SPF record" {...emailChecks.spf} />
                  <CheckCard icon="📋" title="DMARC policy" {...emailChecks.dmarc} />
                  <CheckCard icon="🔑" title="DKIM signature" {...emailChecks.dkim} />
                </div>
                <CheckCard icon="🚫" title="Blacklist check" {...(emailChecks.blacklist || { status: 'idle' })} />

                {mxRecords.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={s.sectionTitle}>MX record details</p>
                    <div style={s.mxTable}>
                      <div style={s.mxHead}><span>Priority</span><span>Mail server</span><span>Status</span></div>
                      {mxRecords.map((r, i) => (
                        <div key={i} style={{ ...s.mxRow, borderBottom: i < mxRecords.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ fontFamily: 'monospace', color: 'var(--gray-500)' }}>{r.priority}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.host}</span>
                          <span style={{ ...s.badge('ok'), width: 'fit-content' }}>Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={s.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>📧</div>
                <p style={{ fontSize: 15 }}>Enter a domain or email to check MX, SPF, DMARC, DKIM and blacklists</p>
              </div>
            )}
          </>
        )}

        {/* SMTP tab */}
        {tab === 'smtp' && (
          <div style={s.smtpWrap}>
            <div style={{ background: 'var(--green-bg)', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--green)' }}>
              🔒 Credentials are sent only to your SMTP server — never stored.
            </div>
            <div style={s.formGrid}>
              {[['host','SMTP host','mail.yourdomain.com','text'],['port','Port','587','text'],['user','Username / email','you@yourdomain.com','text'],['password','Password','••••••••','password']].map(([key, label, ph, type]) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input type={type} value={smtp[key]} onChange={e => setSmtp(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={s.fieldInput} />
                </div>
              ))}
            </div>
            <div style={{ ...s.field, marginBottom: 16 }}>
              <label style={s.label}>Send test email to</label>
              <input type="text" value={smtp.to} onChange={e => setSmtp(p => ({ ...p, to: e.target.value }))} placeholder="testinbox@gmail.com" style={s.fieldInput} />
            </div>
            <button style={{ ...s.smtpBtn, opacity: smtpRunning ? 0.6 : 1 }} onClick={runSmtp} disabled={smtpRunning}>
              {smtpRunning ? '⏳ Running test…' : '📤 Send test email'}
            </button>

            {smtpResult && (
              <div style={{ marginTop: 16 }}>
                <div style={{
                  background: smtpResult.success ? 'var(--green-bg)' : 'var(--red-bg)',
                  border: `1px solid ${smtpResult.success ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 'var(--radius-md)', padding: '14px 16px',
                }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: smtpResult.success ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
                    {smtpResult.success ? '✅ SMTP is working!' : '❌ SMTP test failed'}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--gray-700)' }}>{smtpResult.summary || smtpResult.error}</p>
                  {smtpResult.fix && <p style={{ fontSize: 13, marginTop: 8, color: '#92400e' }}><strong>Fix: </strong>{smtpResult.fix}</p>}
                </div>
                {smtpResult.steps && (
                  <div style={{ marginTop: 10, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {smtpResult.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: i < smtpResult.steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span>{step.status === 'ok' ? '✅' : '❌'}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500 }}>{step.step}</p>
                          <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 20, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>Common ports</p>
              {[['587','STARTTLS — use this first',true],['465','SSL/TLS',false],['25','Direct (usually blocked)',false]].map(([p, d, rec]) => (
                <div key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <code style={{ fontSize: 12, background: 'var(--white)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>{p}</code>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{d}</span>
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
