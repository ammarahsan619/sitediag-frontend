import React, { useState } from 'react';
import CheckCard from './CheckCard';
import AiSummary from './AiSummary';
import { BACKEND_URL } from '../App';

export default function EmailChecker() {
  const [input, setInput]     = useState('');
  const [checks, setChecks]   = useState({});
  const [mxRecords, setMxRecords] = useState([]);
  const [aiText, setAiText]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [ran, setRan]         = useState(false);

  async function run() {
    const val = input.trim();
    if (!val) return;

    setRunning(true);
    setRan(true);
    setAiText('');
    setMxRecords([]);
    setChecks({
      mx:        { status: 'loading' },
      spf:       { status: 'loading' },
      dmarc:     { status: 'loading' },
      dkim:      { status: 'loading' },
      blacklist: { status: 'loading' },
    });

    const body = val.includes('@')
      ? { email: val }
      : { domain: val };

    try {
      const res = await fetch(`${BACKEND_URL}/api/email/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setChecks(data.checks);
      if (data.checks.mx?.records?.length > 0) setMxRecords(data.checks.mx.records);


    } catch (e) {
      setChecks({ mx: { status: 'warn', detail: 'Could not reach backend.' } });
      setAiText('Could not connect to the diagnostic server.');
    }

    setAiLoading(false);
    setRunning(false);
  }

  const domain = input.includes('@') ? input.split('@')[1] : input;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Enter domain or email — e.g. mywebsite.com or me@mywebsite.com"
          style={inputStyle}
        />
        <button onClick={run} disabled={running} style={btnStyle(running)}>
          {running ? 'Checking…' : 'Check'}
        </button>
      </div>

      {ran && (
        <>
          <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            Email diagnostics for {domain}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <CheckCard icon="📬" title="MX records"     {...checks.mx}        />
            <CheckCard icon="🛡️" title="SPF record"     {...checks.spf}       />
            <CheckCard icon="📋" title="DMARC policy"   {...checks.dmarc}     />
            <CheckCard icon="🔑" title="DKIM signature" {...checks.dkim}      />
            <CheckCard icon="🚫" title="Blacklist check" {...checks.blacklist} style={{ gridColumn: '1 / -1' }} />
          </div>

          {/* MX Records table */}
          {mxRecords.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                MX record details
              </p>
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', padding: '8px 14px', background: '#f9fafb', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Priority</span><span>Mail server</span><span>Status</span>
                </div>
                {mxRecords.map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', padding: '10px 14px', borderBottom: i < mxRecords.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13, alignItems: 'center' }}>
                    <span style={{ color: 'var(--gray)', fontFamily: 'monospace' }}>{r.priority}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#111' }}>{r.host}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--green-bg)', color: 'var(--green)', fontWeight: 600, width: 'fit-content' }}>Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AiSummary text={aiText} loading={aiLoading} />
        </>
      )}

      {!ran && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--gray)' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📧</div>
          <p style={{ fontSize: 14 }}>Enter a domain or email address to check MX, SPF, DMARC, DKIM, and blacklists</p>
        </div>
      )}
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
  whiteSpace: 'nowrap',
});
