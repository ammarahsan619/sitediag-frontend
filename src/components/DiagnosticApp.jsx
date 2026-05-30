import React, { useState, useEffect, useCallback } from 'react';
import { BACKEND } from '../App';
import { Spinner, StatusBadge, SeverityTag, CopyButton, DifficultyBar, InfoIcon, Divider, LogoMark } from './UI';

// ── Hosting detection ────────────────────────────────────────────────────────
function detectHosting(checks) {
  const ns  = ((checks?.dns?.nameservers) || []).join(' ').toLowerCase();
  const mx  = ((checks?.mx?.records) || []).map(r => r.host || '').join(' ').toLowerCase();
  const det = (checks?.http?.detail || '').toLowerCase();
  if (ns.includes('cloudflare') || det.includes('cloudflare'))              return { name: 'Cloudflare',       icon: '🔶' };
  if (ns.includes('domaincontrol') || ns.includes('godaddy'))               return { name: 'GoDaddy',          icon: '🐢' };
  if (ns.includes('bluehost'))                                               return { name: 'Bluehost',         icon: '🔵' };
  if (ns.includes('siteground'))                                             return { name: 'SiteGround',       icon: '🌱' };
  if (ns.includes('hostgator'))                                              return { name: 'HostGator',        icon: '🐊' };
  if (ns.includes('wpengine'))                                               return { name: 'WP Engine',        icon: '⚙️' };
  if (ns.includes('digitalocean'))                                           return { name: 'DigitalOcean',     icon: '🌊' };
  if (mx.includes('google') || mx.includes('gmail'))                        return { name: 'Google Workspace', icon: '🔵' };
  if (mx.includes('outlook') || mx.includes('microsoft'))                   return { name: 'Microsoft 365',    icon: '🔷' };
  if (mx.includes('zoho'))                                                   return { name: 'Zoho Mail',        icon: '🔺' };
  return null;
}

// ── Fix database ─────────────────────────────────────────────────────────────
const FIXES = {
  ssl_expired: {
    'Cloudflare':      { steps: ['Log in to Cloudflare dashboard', 'Click your domain → SSL/TLS tab', 'SSL auto-renews for free. If stuck, change mode from Full to Flexible, save, then switch back to Full.'], difficulty: 'easy' },
    'GoDaddy':         { steps: ['Log in to GoDaddy → My Products → SSL Certificates', 'Click Renew next to your certificate', 'Alternatively: cPanel → SSL/TLS → Run AutoSSL'], difficulty: 'easy' },
    'Bluehost':        { steps: ['Log in to Bluehost → Hosting → cPanel', 'Navigate to SSL/TLS Status', 'Click Run AutoSSL to issue a free Let\'s Encrypt certificate'], difficulty: 'easy' },
    'SiteGround':      { steps: ['Log in to SiteGround → Site Tools', 'Security → SSL Manager', 'Install free Let\'s Encrypt for your domain'], difficulty: 'easy' },
    'default':         { steps: ['Log in to your hosting control panel (cPanel)', 'Navigate to SSL/TLS or Security', 'Look for AutoSSL or Let\'s Encrypt and install a free certificate'], difficulty: 'medium' },
  },
  dns_fail: {
    'Cloudflare':      { steps: ['Go to Cloudflare dashboard → your domain → DNS tab', 'Check that an A record exists pointing to your server IP', 'If missing, click Add Record → Type: A → enter your server IP'], difficulty: 'easy' },
    'GoDaddy':         { steps: ['Log in to GoDaddy → DNS → Manage Zones', 'Verify your A record points to your server IP', 'Changes propagate in 0-48 hours depending on TTL'], difficulty: 'easy' },
    'default':         { steps: ['Log in to your domain registrar', 'Navigate to DNS settings or DNS management', 'Add or correct the A record with your server\'s IP address', 'Wait up to 48 hours for propagation'], difficulty: 'medium' },
  },
  no_mx: {
    'Google Workspace':{ steps: ['Go to Google Admin Console → Domains → Manage domains', 'Click Set up Google Workspace email', 'Add the 5 Google MX records to your DNS provider as instructed'], difficulty: 'medium' },
    'Microsoft 365':   { steps: ['Go to Microsoft 365 Admin Center → Settings → Domains', 'Select your domain and click Continue setup', 'Copy the MX record value shown and add it to your DNS provider'], difficulty: 'medium' },
    'default':         { steps: ['Contact your email provider for their MX record values', 'Log in to your DNS provider', 'Add an MX record pointing to your email provider\'s mail server', 'Set the priority (usually 10) as specified by your provider'], difficulty: 'medium' },
  },
  no_spf: {
    spf_values: {
      'Google Workspace': 'v=spf1 include:_spf.google.com ~all',
      'Microsoft 365':    'v=spf1 include:spf.protection.outlook.com ~all',
      'Zoho Mail':        'v=spf1 include:zoho.com ~all',
      'default':          'v=spf1 include:YOUR-MAIL-PROVIDER ~all',
    },
    steps: ['Log in to your DNS provider', 'Add a new TXT record', 'Set Name/Host to @ (or your domain)', 'Set Value to the record shown above', 'Save and wait up to 30 minutes'],
    difficulty: 'easy',
  },
  no_dmarc: {
    value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
    steps: ['Log in to your DNS provider', 'Add a new TXT record', 'Set Name/Host to _dmarc', 'Set Value to the record shown above (replace yourdomain.com)', 'Save — takes effect within 1 hour'],
    difficulty: 'easy',
  },
  blacklisted: {
    steps: ['Identify which blacklist(s) listed your IP from the results above', 'Fix the root cause: secure open mail relays, clean malware, stop spam', 'Visit each blacklist website and submit a delisting request', 'Monitor for 48 hours to confirm removal'],
    difficulty: 'hard',
  },
  http_500: {
    'WP Engine':       { steps: ['Log in to WP Engine dashboard → check site status', 'Try deactivating all plugins: rename /wp-content/plugins via SFTP', 'Reactivate plugins one by one to identify the culprit'], difficulty: 'medium' },
    'Cloudflare':      { steps: ['This error is on your origin server, behind Cloudflare', 'Check if your hosting server (not Cloudflare) is running', 'Log in to your host\'s cPanel and check error logs in Logs section'], difficulty: 'medium' },
    'default':         { steps: ['Check your server error logs (cPanel → Logs → Error Log)', 'Common causes: PHP fatal error, database connection failure, corrupt .htaccess', 'Try renaming .htaccess to .htaccess_bak and refreshing', 'Check if your database server is running'], difficulty: 'hard' },
  },
};

function getHostingFix(type, hostingName) {
  const map = FIXES[type];
  if (!map) return null;
  return map[hostingName] || map['default'] || null;
}

// ── Score calculation ─────────────────────────────────────────────────────────
function calcScore(checks) {
  const W = { dns: 25, http: 20, ssl: 20, whois: 10, mx: 10, spf: 5, dmarc: 5, dkim: 3, blacklist: 2 };
  let total = 0, max = 0;
  Object.entries(checks).forEach(([k, v]) => {
    const w = W[k] || 5;
    max += w;
    if (v.status === 'ok')   total += w;
    if (v.status === 'warn') total += w * 0.5;
  });
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

function scoreInfo(score) {
  if (score >= 90) return { label: 'Excellent', color: '#16a34a', desc: 'Everything is configured correctly.' };
  if (score >= 75) return { label: 'Good',      color: '#16a34a', desc: 'Minor issues detected — address when possible.' };
  if (score >= 55) return { label: 'Fair',      color: '#ca8a04', desc: 'Several issues need your attention.' };
  if (score >= 30) return { label: 'Poor',      color: '#dc2626', desc: 'Significant problems affecting your site or email.' };
  return            { label: 'Critical', color: '#b91c1c', desc: 'Critical failures — immediate action required.' };
}

// ── Tooltips / explanations for non-technical users ──────────────────────────
const TERM_GLOSSARY = {
  'DNS':         'DNS (Domain Name System) converts your domain name into a server IP address — like a phonebook for the internet. Without working DNS, nobody can find your site.',
  'MX Record':   'An MX record tells the internet which server handles email for your domain. Without it, nobody can send you email.',
  'SSL':         'SSL (Secure Sockets Layer) creates an encrypted connection between your site and visitors. The padlock icon in browsers means SSL is active.',
  'SPF':         'SPF (Sender Policy Framework) tells email services which servers are allowed to send email as you. Helps prevent spammers from impersonating your domain.',
  'DKIM':        'DKIM adds a cryptographic signature to your emails proving they really came from you and weren\'t tampered with.',
  'DMARC':       'DMARC tells email providers what to do with emails that fail SPF or DKIM — quarantine them, reject them, or do nothing.',
  'Blacklist':   'Email blacklists are databases of IPs known to send spam. If your server IP is listed, many email providers will silently block your emails.',
  'SMTP':        'SMTP (Simple Mail Transfer Protocol) is the system used to send email between servers. An SMTP test actually sends an email to verify delivery works end to end.',
  'Nameserver':  'Nameservers are the servers that hold your domain\'s DNS records. They\'re usually provided by your domain registrar or hosting company.',
  'A Record':    'An A record maps your domain name to your server\'s IP address — the most fundamental DNS record for making your website accessible.',
};

// ── Check card component ──────────────────────────────────────────────────────
function CheckCard({ icon, title, termKey, status, detail, sub, fix, hosting, severity, copyValue, copyName, children }) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = { ok: '#16a34a', warn: '#f59e0b', fail: '#ef4444', loading: 'var(--border)', idle: 'var(--border)', error: '#ef4444' }[status] || 'var(--border)';
  const isActionable = status === 'fail' || status === 'warn';

  useEffect(() => {
    if (status === 'fail') setExpanded(true);
  }, [status]);

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      boxShadow: status === 'fail' ? '0 0 0 3px rgba(239,68,68,0.06)' : 'var(--shadow-xs)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header */}
      <div
        style={{ padding: '14px 16px', cursor: isActionable ? 'pointer' : 'default', userSelect: 'none' }}
        onClick={() => isActionable && setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: status !== 'idle' && status !== 'loading' ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
            {termKey && <InfoIcon text={TERM_GLOSSARY[termKey] || ''} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {severity && isActionable && <SeverityTag level={severity} />}
            <StatusBadge status={status} compact />
            {isActionable && (
              <span style={{ fontSize: 10, color: 'var(--text-3)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 2 }}>▾</span>
            )}
          </div>
        </div>

        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Spinner size={12} />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Checking...</span>
          </div>
        )}
        {status !== 'loading' && status !== 'idle' && detail && (
          <p style={{ fontSize: 12.5, color: 'var(--text)', fontFamily: 'var(--mono)', lineHeight: 1.5, marginBottom: sub ? 3 : 0 }}>{detail}</p>
        )}
        {sub && <p style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{sub}</p>}
      </div>

      {/* Expandable fix section */}
      {isActionable && expanded && (fix || copyValue || children) && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)', padding: '14px 16px', animation: 'fadeIn 0.2s ease both' }}>
          {children}

          {copyValue && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Add this DNS record
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {[['Type','TXT'], ['Name', copyName || '@']].map(([k,v]) => (
                  <div key={k} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '3px 9px', fontSize: 11.5 }}>
                    <span style={{ color: 'var(--text-3)' }}>{k}: </span>
                    <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', marginBottom: 8, wordBreak: 'break-all', lineHeight: 1.6 }}>
                {copyValue}
              </div>
              <CopyButton value={copyValue} label="Copy record value" size="sm" />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Paste this as a TXT record in your DNS provider</p>
            </div>
          )}

          {fix && (
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {hosting ? `How to fix on ${hosting}` : 'How to fix'}
              </p>
              <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fix.steps.map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i+1}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>{step}</span>
                  </li>
                ))}
              </ol>
              {fix.difficulty && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <DifficultyBar level={fix.difficulty} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Health score ring ─────────────────────────────────────────────────────────
function HealthRing({ score, size = 80 }) {
  const info = scoreInfo(score);
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (circ * score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={info.color} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.26, fontWeight: 700, color: info.color, lineHeight: 1, fontFamily: 'var(--mono)' }}>{score}</span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-3)', letterSpacing: '0.04em', marginTop: 1 }}>/100</span>
      </div>
    </div>
  );
}

// ── IP & Hosting info panel ───────────────────────────────────────────────────
function HostingPanel({ checks, hosting, domain }) {
  const ip   = checks?.dns?.ips?.[0] || null;
  const ns   = checks?.dns?.nameservers || [];
  if (!ip && !hosting && ns.length === 0) return null;
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginBottom: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Server Information</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
        {ip && <InfoPair label="Server IP" value={ip} mono />}
        {hosting && <InfoPair label="Hosting / CDN" value={`${hosting.icon} ${hosting.name}`} />}
        {ns.length > 0 && <InfoPair label="Nameservers" value={ns.slice(0,2).join(', ')} mono />}
        {checks?.http?.code && <InfoPair label="HTTP Status" value={`${checks.http.code}`} mono />}
        {checks?.ssl?.issuer && <InfoPair label="SSL Issuer" value={checks.ssl.issuer} />}
        {checks?.ssl?.daysLeft != null && <InfoPair label="SSL Expiry" value={`${checks.ssl.daysLeft} days`} color={checks.ssl.daysLeft < 14 ? 'var(--fail)' : checks.ssl.daysLeft < 30 ? 'var(--warn)' : 'var(--ok)'} />}
      </div>
    </div>
  );
}

function InfoPair({ label, value, mono, color }) {
  return (
    <div>
      <p style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 12.5, color: color || 'var(--text)', fontFamily: mono ? 'var(--mono)' : 'var(--font)', wordBreak: 'break-all', lineHeight: 1.4 }}>{value}</p>
    </div>
  );
}

// ── MX Records table ──────────────────────────────────────────────────────────
function MxTable({ records }) {
  if (!records?.length) return null;
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '56px 1fr 72px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <span>Priority</span><span>Mail server</span><span>Status</span>
      </div>
      {records.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 72px', padding: '10px 14px', alignItems: 'center', borderBottom: i < records.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-2)', fontWeight: 500 }}>{r.priority}</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{r.host}</span>
          <StatusBadge status="ok" compact />
        </div>
      ))}
    </div>
  );
}

// ── Email security teaser ─────────────────────────────────────────────────────
function EmailTeaser({ onSwitch }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Email security snapshot</p>
        <button onClick={onSwitch} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500 }}>Run full email check →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {['SPF','DMARC','DKIM','Blacklist'].map(name => (
          <div key={name} onClick={onSwitch} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{name}</p>
            <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Click to check</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Blacklist pills ───────────────────────────────────────────────────────────
function BlacklistResult({ check }) {
  if (!check || check.status === 'loading' || check.status === 'idle') return null;
  const listed = check.listed || [];
  const clean  = check.clean  || [];
  return (
    <div style={{ marginTop: 8 }}>
      {listed.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--fail)', marginBottom: 6 }}>Listed on {listed.length} blacklist{listed.length > 1 ? 's' : ''}:</p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {listed.map(l => <span key={l} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--fail-bg)', color: 'var(--fail)', border: '1px solid var(--fail-bdr)' }}>{l}</span>)}
          </div>
        </div>
      )}
      {clean.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ok)', marginBottom: 6 }}>Clean on {clean.length} blacklists:</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {clean.slice(0,12).map(l => <span key={l} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 99, background: 'var(--ok-bg)', color: 'var(--ok)', border: '1px solid var(--ok-bdr)' }}>{l}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SMTP Tester ───────────────────────────────────────────────────────────────
function SmtpTester() {
  const [form, setForm]   = useState({ host: '', port: '587', user: '', password: '', to: '' });
  const [result, setRes]  = useState(null);
  const [running, setRun] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function run() {
    if (!form.host || !form.user || !form.password || !form.to) return;
    setRun(true); setRes(null);
    try {
      const r = await fetch(`${BACKEND}/api/smtp/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, port: parseInt(form.port) }),
      });
      setRes(await r.json());
    } catch { setRes({ success: false, error: 'Could not reach backend server.' }); }
    setRun(false);
  }

  const fieldStyle = { width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13.5, outline: 'none', fontFamily: 'var(--font)', color: 'var(--text)', background: 'var(--white)', transition: 'border-color 0.15s' };

  return (
    <div>
      <div style={{ background: 'var(--ok-bg)', border: '1px solid var(--ok-bdr)', borderRadius: 'var(--r-md)', padding: '9px 14px', marginBottom: 20, fontSize: 12.5, color: 'var(--ok)', display: 'flex', gap: 7, alignItems: 'center' }}>
        <span>🔒</span>
        <span>Your credentials are used only to connect to your mail server. They are never stored, logged, or transmitted to us.</span>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {[
            { label: 'SMTP Host', placeholder: 'mail.yourdomain.com', key: 'host',     type: 'text'     },
            { label: 'Port',      placeholder: '587',                  key: 'port',     type: 'text'     },
            { label: 'Username',  placeholder: 'you@yourdomain.com',   key: 'user',     type: 'text'     },
            { label: 'Password',  placeholder: '••••••••',             key: 'password', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, letterSpacing: '0.03em' }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} style={fieldStyle}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, letterSpacing: '0.03em' }}>Send test email to</label>
          <input type="text" value={form.to} onChange={set('to')} placeholder="testinbox@gmail.com" style={fieldStyle}
            onFocus={e => e.target.style.borderColor='var(--accent)'}
            onBlur={e => e.target.style.borderColor='var(--border)'}
          />
        </div>
        <button onClick={run} disabled={running} style={{
          width: '100%', padding: 12, background: running ? 'var(--border)' : 'var(--text)',
          color: running ? 'var(--text-3)' : '#fff', border: 'none', borderRadius: 'var(--r-md)',
          fontSize: 14, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font)',
        }}>
          {running ? <><Spinner size={14} color="#fff" /> Running test…</> : '📤 Send test email'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 14, animation: 'scaleIn 0.25s ease both' }}>
          <div style={{ padding: '14px 16px', background: result.success ? 'var(--ok-bg)' : 'var(--fail-bg)', border: `1px solid ${result.success ? 'var(--ok-bdr)' : 'var(--fail-bdr)'}`, borderRadius: 'var(--r-lg)', marginBottom: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: result.success ? 'var(--ok)' : 'var(--fail)', marginBottom: 4 }}>
              {result.success ? '✅ SMTP test passed' : '❌ SMTP test failed'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{result.summary || result.error}</p>
            {result.fix && <p style={{ fontSize: 12.5, marginTop: 8, color: 'var(--warn)' }}><b>Fix: </b>{result.fix}</p>}
          </div>
          {result.steps?.length > 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              {result.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: i < result.steps.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.status === 'ok' ? '✅' : '❌'}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{s.step}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 18, background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '14px 16px', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.01em' }}>Which port should I use?</p>
        {[['587','STARTTLS (Recommended)','Start here — works with most providers','easy'],['465','SSL/TLS','Use if port 587 doesn\'t work',null],['25','Direct SMTP','Usually blocked by ISPs and hosting providers',null]].map(([p,name,desc,rec]) => (
          <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: p !== '25' ? '1px solid var(--border)' : 'none' }}>
            <code style={{ fontSize: 12.5, padding: '2px 8px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', flexShrink: 0, fontFamily: 'var(--mono)', marginTop: 1 }}>{p}</code>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{name}</span>
              {rec && <span style={{ marginLeft: 7, fontSize: 10.5, padding: '1px 7px', borderRadius: 99, background: 'var(--ok-bg)', color: 'var(--ok)', border: '1px solid var(--ok-bdr)', fontWeight: 600 }}>Start here</span>}
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Website checker ───────────────────────────────────────────────────────────
function WebsiteChecker({ seed, onSwitchToEmail }) {
  const [domain, setDomain] = useState(seed || '');
  const [checks, setChecks] = useState(null);
  const [hosting, setHosting] = useState(null);
  const [running, setRunning] = useState(false);
  const [score,   setScore]  = useState(null);

  useEffect(() => { if (seed) { setDomain(seed); setTimeout(run, 300); } }, [seed]);

  async function run() {
    const d = domain.trim().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,'');
    if (!d) return;
    setRunning(true);
    setScore(null);
    setChecks({ dns: {status:'loading'}, http: {status:'loading'}, ssl: {status:'loading'}, whois: {status:'loading'} });
    try {
      const res  = await fetch(`${BACKEND}/api/website/diagnose`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({domain:d}) });
      const data = await res.json();
      const h    = detectHosting(data.checks);
      setHosting(h);
      const c    = { ...data.checks };
      if (c.ssl?.status   === 'fail') c.ssl.fix   = getHostingFix('ssl_expired',  h?.name);
      if (c.dns?.status   === 'fail') c.dns.fix   = getHostingFix('dns_fail',     h?.name);
      if (c.http?.detail?.includes('500')) c.http.fix = getHostingFix('http_500', h?.name);
      setChecks(c);
      setScore(calcScore(c));
    } catch {
      setChecks({ dns: {status:'warn', detail:'Could not reach backend server.'}, http:{status:'idle'}, ssl:{status:'idle'}, whois:{status:'idle'} });
    }
    setRunning(false);
  }

  const si = score !== null ? scoreInfo(score) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key==='Enter'&&run()}
          placeholder="Enter domain — e.g. mywebsite.com"
          style={{ flex:1, fontSize:14.5, padding:'10px 13px', border:'1px solid var(--border)', borderRadius:'var(--r-md)', outline:'none', color:'var(--text)', background:'var(--white)', fontFamily:'var(--font)', transition:'border-color 0.15s' }}
          onFocus={e=>e.target.style.borderColor='var(--accent)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}
        />
        <button onClick={run} disabled={running} style={{ padding:'10px 22px', background:running?'var(--border)':'var(--accent)', color:running?'var(--text-3)':'#fff', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:600, cursor:running?'not-allowed':'pointer', whiteSpace:'nowrap', fontFamily:'var(--font)', transition:'background 0.15s' }}
          onMouseEnter={e=>!running&&(e.target.style.background='var(--accent-h)')}
          onMouseLeave={e=>!running&&(e.target.style.background='var(--accent)')}>
          {running ? 'Scanning…' : 'Diagnose →'}
        </button>
      </div>

      {checks ? (
        <div className="anim-scale-in">
          {/* Score summary bar */}
          {si && score !== null && (
            <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'18px 20px', marginBottom:12, display:'flex', alignItems:'center', gap:18, boxShadow:'var(--shadow-sm)' }}>
              <HealthRing score={score} size={76} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                  <span style={{ fontSize:16, fontWeight:700, color:si.color }}>{si.label}</span>
                  {hosting && (
                    <span style={{ fontSize:11.5, padding:'2px 9px', borderRadius:99, background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--text-2)' }}>
                      {hosting.icon} {hosting.name} detected
                    </span>
                  )}
                </div>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.55 }}>{si.desc}</p>
                <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                  {[['ok','Passed'],['warn','Warnings'],['fail','Failed']].map(([s,label]) => {
                    const count = Object.values(checks).filter(c=>c.status===s).length;
                    if (!count) return null;
                    const colors = {ok:'var(--ok)',warn:'var(--warn)',fail:'var(--fail)'};
                    return <span key={s} style={{ fontSize:12, fontWeight:600, color:colors[s] }}>{count} {label}</span>;
                  })}
                </div>
              </div>
            </div>
          )}

          <HostingPanel checks={checks} hosting={hosting} />

          <p style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Diagnostic results</p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <CheckCard icon="🔍" title="DNS Resolution" termKey="DNS"    status={checks.dns?.status}   detail={checks.dns?.detail}   sub={checks.dns?.nameservers?.slice(0,2).join(', ')} fix={checks.dns?.fix} hosting={hosting?.name} severity={checks.dns?.status==='fail'?'critical':checks.dns?.status==='warn'?'medium':null} />
            <CheckCard icon="🌐" title="HTTP Status"                      status={checks.http?.status}  detail={checks.http?.detail}  sub={checks.http?.code?`Status code: ${checks.http.code}`:null} fix={checks.http?.fix} hosting={hosting?.name} severity={checks.http?.status==='fail'?'high':checks.http?.status==='warn'?'medium':null} />
            <CheckCard icon="🔒" title="SSL Certificate" termKey="SSL"   status={checks.ssl?.status}   detail={checks.ssl?.detail}   sub={checks.ssl?.expiry?`Expires: ${checks.ssl.expiry}`:null} fix={checks.ssl?.fix} hosting={hosting?.name} severity={checks.ssl?.status==='fail'?'critical':checks.ssl?.status==='warn'?'high':null} />
            <CheckCard icon="📅" title="Domain Expiry"                    status={checks.whois?.status} detail={checks.whois?.detail} sub={checks.whois?.expiry?`Expiry: ${checks.whois.expiry}`:null} fix={checks.whois?.fix} hosting={hosting?.name} severity={checks.whois?.status==='fail'?'critical':checks.whois?.status==='warn'?'medium':null} />
          </div>

          <EmailTeaser onSwitch={onSwitchToEmail} />
        </div>
      ) : (
        <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--text-3)' }}>
          <div style={{ fontSize:42, marginBottom:14, opacity:0.2 }}>🌐</div>
          <p style={{ fontSize:15, color:'var(--text-2)', marginBottom:6 }}>Enter a domain above to start diagnosis</p>
          <p style={{ fontSize:13 }}>Checks DNS, HTTP status, SSL certificate, and domain expiry</p>
        </div>
      )}
    </div>
  );
}

// ── Email checker ─────────────────────────────────────────────────────────────
function EmailChecker({ seed }) {
  const [input,   setInput]   = useState(seed || '');
  const [checks,  setChecks]  = useState(null);
  const [mxRecs,  setMxRecs]  = useState([]);
  const [hosting, setHosting] = useState(null);
  const [running, setRunning] = useState(false);
  const [score,   setScore]   = useState(null);

  async function run() {
    const val = input.trim();
    if (!val) return;
    setRunning(true);
    setMxRecs([]);
    setScore(null);
    setChecks({ mx:{status:'loading'}, spf:{status:'loading'}, dmarc:{status:'loading'}, dkim:{status:'loading'}, blacklist:{status:'loading'} });
    try {
      const body = val.includes('@') ? {email:val} : {domain:val};
      const res  = await fetch(`${BACKEND}/api/email/diagnose`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await res.json();
      const h    = detectHosting(data.checks);
      setHosting(h);
      const c    = { ...data.checks };
      if (c.mx?.status        === 'fail') c.mx.fix        = getHostingFix('no_mx',       h?.name);
      if (c.blacklist?.status === 'fail') c.blacklist.fix = getHostingFix('blacklisted',  h?.name);
      setChecks(c);
      if (data.checks.mx?.records?.length) setMxRecs(data.checks.mx.records);
      const emailScore = calcScore({ mx:c.mx, spf:c.spf, dmarc:c.dmarc, dkim:c.dkim, blacklist:c.blacklist });
      setScore(emailScore);
    } catch {
      setChecks({ mx:{status:'warn',detail:'Could not reach backend.'} });
    }
    setRunning(false);
  }

  const spfValue   = FIXES.no_spf.spf_values[hosting?.name] || FIXES.no_spf.spf_values['default'];
  const dmarcValue = FIXES.no_dmarc.value;
  const domain     = input.includes('@') ? input.split('@')[1] : input.replace(/^www\./,'');
  const si         = score !== null ? scoreInfo(score) : null;

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run()}
          placeholder="Enter domain or email — e.g. mysite.com or me@mysite.com"
          style={{ flex:1, fontSize:14.5, padding:'10px 13px', border:'1px solid var(--border)', borderRadius:'var(--r-md)', outline:'none', color:'var(--text)', background:'var(--white)', fontFamily:'var(--font)', transition:'border-color 0.15s' }}
          onFocus={e=>e.target.style.borderColor='var(--accent)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}
        />
        <button onClick={run} disabled={running} style={{ padding:'10px 22px', background:running?'var(--border)':'var(--accent)', color:running?'var(--text-3)':'#fff', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:600, cursor:running?'not-allowed':'pointer', whiteSpace:'nowrap', fontFamily:'var(--font)' }}
          onMouseEnter={e=>!running&&(e.target.style.background='var(--accent-h)')}
          onMouseLeave={e=>!running&&(e.target.style.background='var(--accent)')}>
          {running ? 'Checking…' : 'Check →'}
        </button>
      </div>

      {checks ? (
        <div className="anim-scale-in">
          {si && score !== null && (
            <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'18px 20px', marginBottom:12, display:'flex', alignItems:'center', gap:18 }}>
              <HealthRing score={score} size={76} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                  <span style={{ fontSize:16, fontWeight:700, color:si.color }}>Email security: {si.label}</span>
                  {hosting && <span style={{ fontSize:11.5, padding:'2px 9px', borderRadius:99, background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--text-2)' }}>{hosting.icon} {hosting.name}</span>}
                </div>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.55 }}>{si.desc}</p>
              </div>
            </div>
          )}

          <p style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
            Email diagnostics{domain ? ` for ${domain}` : ''}
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <CheckCard icon="📬" title="MX Records"      termKey="MX Record"  status={checks.mx?.status}    detail={checks.mx?.detail}    sub={checks.mx?.provider?`Provider: ${checks.mx.provider}`:null} fix={checks.mx?.fix} hosting={hosting?.name} severity={checks.mx?.status==='fail'?'critical':null} />
            <CheckCard icon="🛡️" title="SPF Record"       termKey="SPF"        status={checks.spf?.status}   detail={checks.spf?.detail}   sub={checks.spf?.policy?`Policy: ${checks.spf.policy}`:null}
              severity={checks.spf?.status==='fail'?'high':checks.spf?.status==='warn'?'medium':null}
              copyValue={checks.spf?.status==='fail'?spfValue:null} copyName="@"
            >
              {checks.spf?.status==='fail' && <p style={{ fontSize:12.5, color:'var(--text-2)', marginBottom:10, lineHeight:1.5 }}>An SPF record tells email providers which servers are allowed to send email as you. Without it, your emails may be marked as spam or rejected.</p>}
            </CheckCard>
            <CheckCard icon="📋" title="DMARC Policy"    termKey="DMARC"      status={checks.dmarc?.status} detail={checks.dmarc?.detail} sub={checks.dmarc?.policy?`Policy: ${checks.dmarc.policy}`:null}
              severity={checks.dmarc?.status==='fail'?'high':checks.dmarc?.status==='warn'?'medium':null}
              copyValue={checks.dmarc?.status==='fail'?dmarcValue:null} copyName="_dmarc"
            >
              {checks.dmarc?.status==='fail' && <p style={{ fontSize:12.5, color:'var(--text-2)', marginBottom:10, lineHeight:1.5 }}>DMARC protects your domain from being used by spammers to send fake emails. Without it, anyone can send email pretending to be you.</p>}
            </CheckCard>
            <CheckCard icon="🔑" title="DKIM Signature"  termKey="DKIM"       status={checks.dkim?.status}  detail={checks.dkim?.detail}  sub={checks.dkim?.selectors?.length?`Selectors: ${checks.dkim.selectors.map(s=>s.selector).join(', ')}`:null} severity={checks.dkim?.status==='fail'?'medium':null} />
          </div>

          <CheckCard icon="🚫" title="Blacklist Check" termKey="Blacklist" status={checks.blacklist?.status} detail={checks.blacklist?.detail} sub={checks.blacklist?.ip?`Checked IP: ${checks.blacklist.ip}`:null} fix={checks.blacklist?.status==='fail'?getHostingFix('blacklisted',null):null} severity={checks.blacklist?.status==='fail'?'critical':null}>
            <BlacklistResult check={checks.blacklist} />
          </CheckCard>

          <MxTable records={mxRecs} />
        </div>
      ) : (
        <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--text-3)' }}>
          <div style={{ fontSize:42, marginBottom:14, opacity:0.2 }}>📧</div>
          <p style={{ fontSize:15, color:'var(--text-2)', marginBottom:6 }}>Enter a domain or email address</p>
          <p style={{ fontSize:13 }}>Checks MX records, SPF, DMARC, DKIM, and 10 blacklists</p>
        </div>
      )}
    </div>
  );
}

// ── Speed checker ─────────────────────────────────────────────────────────────
function SpeedChecker() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  async function run() {
    const d = domain.trim().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,'');
    if (!d) return;
    setRunning(true); setResult(null);
    const start = Date.now();
    try {
      const res = await fetch(`${BACKEND}/api/website/diagnose`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({domain:d}) });
      const data = await res.json();
      const elapsed = Date.now() - start;
      const httpDetail = data.checks?.http?.detail || '';
      const timeMatch  = httpDetail.match(/(\d+)ms/);
      const ms = timeMatch ? parseInt(timeMatch[1]) : Math.round(elapsed * 0.6);
      setResult({
        ms,
        grade: ms < 200 ? 'A' : ms < 500 ? 'B' : ms < 1000 ? 'C' : ms < 2000 ? 'D' : 'F',
        label: ms < 200 ? 'Excellent' : ms < 500 ? 'Good' : ms < 1000 ? 'Average' : ms < 2000 ? 'Slow' : 'Very slow',
        color: ms < 200 ? 'var(--ok)' : ms < 500 ? 'var(--ok)' : ms < 1000 ? 'var(--warn)' : 'var(--fail)',
        tips: ms >= 1000 ? ['Enable caching (W3 Total Cache or WP Rocket for WordPress)','Enable Cloudflare CDN for faster global delivery','Compress images before uploading (use WebP format)','Minimise CSS and JavaScript files','Upgrade to a faster hosting plan'] : [],
      });
    } catch { setResult(null); }
    setRunning(false);
  }

  return (
    <div>
      <div style={{ background:'var(--info-bg)', border:'1px solid var(--info-bdr)', borderRadius:'var(--r-md)', padding:'10px 14px', marginBottom:20, fontSize:12.5, color:'var(--info)' }}>
        ℹ️ Response time measures how quickly your server responds to an initial request. This is a simplified check — for a full performance audit, combine with Google PageSpeed Insights.
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input value={domain} onChange={e=>setDomain(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run()}
          placeholder="Enter domain — e.g. mywebsite.com"
          style={{ flex:1, fontSize:14.5, padding:'10px 13px', border:'1px solid var(--border)', borderRadius:'var(--r-md)', outline:'none', color:'var(--text)', background:'var(--white)', fontFamily:'var(--font)', transition:'border-color 0.15s' }}
          onFocus={e=>e.target.style.borderColor='var(--accent)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}
        />
        <button onClick={run} disabled={running} style={{ padding:'10px 22px', background:running?'var(--border)':'var(--accent)', color:running?'var(--text-3)':'#fff', border:'none', borderRadius:'var(--r-md)', fontSize:14, fontWeight:600, cursor:running?'not-allowed':'pointer', whiteSpace:'nowrap', fontFamily:'var(--font)' }}>
          {running ? 'Testing…' : 'Test speed →'}
        </button>
      </div>

      {result && (
        <div className="anim-scale-in">
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'24px', marginBottom:10, display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', border:`4px solid ${result.color}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:28, fontWeight:800, color:result.color, lineHeight:1, fontFamily:'var(--mono)' }}>{result.grade}</span>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:18, fontWeight:700, color:result.color, marginBottom:4 }}>{result.label}</p>
              <p style={{ fontSize:14, color:'var(--text-2)' }}>Server responded in <strong style={{ fontFamily:'var(--mono)', color:'var(--text)' }}>{result.ms}ms</strong></p>
              <p style={{ fontSize:12.5, color:'var(--text-3)', marginTop:4 }}>
                {result.ms < 200 ? 'Excellent response time. Visitors experience fast page loads.' :
                 result.ms < 500 ? 'Good response time. Most visitors won\'t notice delays.' :
                 result.ms < 1000 ? 'Average. Some visitors may experience slight delays.' :
                 'Slow response time. This is likely hurting your search rankings and visitor experience.'}
              </p>
            </div>
          </div>
          {result.tips.length > 0 && (
            <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'16px' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.06em' }}>Speed improvement recommendations</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ width:20, height:20, borderRadius:'50%', background:'var(--accent-bg)', color:'var(--accent)', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                    <span style={{ fontSize:13, color:'var(--text)', lineHeight:1.55 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !running && (
        <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--text-3)' }}>
          <div style={{ fontSize:42, marginBottom:14, opacity:0.2 }}>⚡</div>
          <p style={{ fontSize:15, color:'var(--text-2)', marginBottom:6 }}>Enter a domain to check response time</p>
          <p style={{ fontSize:13 }}>Measures how quickly your server responds to visitor requests</p>
        </div>
      )}
    </div>
  );
}

// ── Main diagnostic app shell ─────────────────────────────────────────────────
const TABS = [
  { id: 'website', label: '🌐 Website',   desc: 'DNS, HTTP, SSL, expiry' },
  { id: 'email',   label: '📧 Email / MX', desc: 'MX, SPF, DMARC, DKIM, blacklists' },
  { id: 'speed',   label: '⚡ Speed',      desc: 'Response time' },
  { id: 'smtp',    label: '📤 SMTP Test',  desc: 'Send a test email' },
];

export default function DiagnosticApp({ seed = '', seedTab = 'website', onBack }) {
  const [tab, setTab] = useState(seedTab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Top bar */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', height: 52, gap: 14, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--text-2)',padding:'6px 0',fontFamily:'var(--font)' }}>
          ← Home
        </button>
        <div style={{ width:1, height:18, background:'var(--border)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <LogoMark size={22} />
          <span style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)' }}>SiteDiag</span>
        </div>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:12, color:'var(--text-3)', background:'var(--bg-2)', border:'1px solid var(--border)', padding:'3px 9px', borderRadius:99 }}>Free tool</span>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px' }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display:'flex', flexDirection:'column', alignItems:'flex-start',
              padding:'8px 14px', borderRadius:'var(--r-md)', fontSize:13, fontWeight:tab===t.id?600:400,
              cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font)', lineHeight:1.3,
              background: tab===t.id ? 'var(--text)' : 'var(--white)',
              color: tab===t.id ? '#fff' : 'var(--text-2)',
              border: tab===t.id ? 'none' : '1px solid var(--border)',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'website' && <WebsiteChecker seed={seed} onSwitchToEmail={() => setTab('email')} />}
        {tab === 'email'   && <EmailChecker seed={seed} />}
        {tab === 'speed'   && <SpeedChecker />}
        {tab === 'smtp'    && <SmtpTester />}
      </div>
    </div>
  );
}
