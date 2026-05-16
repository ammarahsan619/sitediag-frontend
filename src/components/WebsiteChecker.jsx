import React, { useState } from 'react';
import CheckCard from './CheckCard';
import AiSummary from './AiSummary';
import { BACKEND_URL } from '../App';

const DEFAULT_CHECKS = {
  dns:   { status: 'idle' },
  http:  { status: 'idle' },
  ssl:   { status: 'idle' },
  whois: { status: 'idle' },
};

export default function WebsiteChecker() {
  const [domain, setDomain]   = useState('');
  const [checks, setChecks]   = useState(DEFAULT_CHECKS);
  const [aiText, setAiText]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [ran, setRan]         = useState(false);

  async function run() {
    const d = domain.trim().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,'');
    if (!d) return;

    setRunning(true);
    setRan(true);
    setAiText('');
    setChecks({
      dns:   { status: 'loading' },
      http:  { status: 'loading' },
      ssl:   { status: 'loading' },
      whois: { status: 'loading' },
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/website/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      });
      const data = await res.json();
      setChecks(data.checks);


    } catch (e) {
      setChecks({
        dns:   { status: 'warn', detail: 'Could not reach backend. Make sure backend is running.' },
        http:  { status: 'idle' },
        ssl:   { status: 'idle' },
        whois: { status: 'idle' },
      });
      setAiText('Could not connect to the diagnostic server.');
    }

    setAiLoading(false);
    setRunning(false);
  }

  return (
    <div>
      {/* Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Enter your domain — e.g. mywebsite.com"
          style={inputStyle}
        />
        <button onClick={run} disabled={running} style={btnStyle(running)}>
          {running ? 'Running…' : 'Diagnose'}
        </button>
      </div>

      {/* Cards */}
      {ran && (
        <>
          <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            Diagnostic results
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <CheckCard icon="🔍" title="DNS resolution"   {...checks.dns}   />
            <CheckCard icon="🌐" title="HTTP status"      {...checks.http}  />
            <CheckCard icon="🔒" title="SSL certificate"  {...checks.ssl}   />
            <CheckCard icon="📅" title="Domain expiry"    {...checks.whois} />
          </div>
          <AiSummary text={aiText} loading={aiLoading} />
        </>
      )}

      {!ran && <EmptyState icon="🌐" text="Enter a domain above to run a full diagnosis" />}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--gray)' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{text}</p>
    </div>
  );
}

const inputStyle = {
  flex: 1, fontSize: 15, padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: 8,
  outline: 'none', background: '#fff',
};

const btnStyle = (disabled) => ({
  padding: '10px 22px', fontSize: 14, fontWeight: 500,
  background: disabled ? '#9ca3af' : '#111', color: '#fff',
  border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
  whiteSpace: 'nowrap', transition: 'background 0.15s',
});
