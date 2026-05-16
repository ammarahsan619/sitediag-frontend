import React, { useState } from 'react';
import { BACKEND_URL } from '../App';

export default function SmtpTester() {
  const [form, setForm] = useState({ host: '', port: '587', user: '', password: '', to: '' });
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  async function run() {
    if (!form.host || !form.user || !form.password || !form.to) {
      setResult({ success: false, error: 'Please fill in all fields.' });
      return;
    }
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/smtp/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, port: parseInt(form.port) }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ success: false, error: 'Could not reach backend server. Make sure it is running.' });
    }

    setRunning(false);
  }

  return (
    <div>
      {/* Security note */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#166534' }}>
        🔒 Your credentials are sent only to your own SMTP server — never stored anywhere.
      </div>

      {/* Form */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="SMTP host" placeholder="mail.yourdomain.com" value={form.host} onChange={set('host')} />
          <Field label="Port" placeholder="587" value={form.port} onChange={set('port')} />
          <Field label="Username / email" placeholder="you@yourdomain.com" value={form.user} onChange={set('user')} />
          <Field label="Password" placeholder="••••••••" value={form.password} onChange={set('password')} type="password" />
        </div>
        <Field label="Send test email to" placeholder="testinbox@gmail.com" value={form.to} onChange={set('to')} />
        <button onClick={run} disabled={running} style={{ ...btnStyle(running), width: '100%', marginTop: 14, padding: '11px' }}>
          {running ? '⏳ Running test…' : '📤 Send test email'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            background: result.success ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 8, padding: '14px 16px', marginBottom: result.steps ? 12 : 0,
          }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: result.success ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
              {result.success ? '✅ SMTP test passed!' : '❌ SMTP test failed'}
            </p>
            <p style={{ fontSize: 13, color: '#374151' }}>{result.summary || result.error}</p>
            {result.fix && (
              <p style={{ fontSize: 13, color: '#92400e', marginTop: 8, padding: '8px 10px', background: '#fffbeb', borderRadius: 6 }}>
                <strong>Fix: </strong>{result.fix}
              </p>
            )}
          </div>

          {/* Steps */}
          {result.steps && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {result.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < result.steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 16 }}>{step.status === 'ok' ? '✅' : '❌'}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{step.step}</p>
                    <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Port guide */}
      <div style={{ marginTop: 16, background: '#f9fafb', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Common SMTP port guide</p>
        {[
          ['587', 'STARTTLS (recommended)', true],
          ['465', 'SSL/TLS', false],
          ['25',  'Direct (usually blocked)', false],
        ].map(([port, desc, rec]) => (
          <div key={port} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <code style={{ fontSize: 12, background: '#e5e7eb', padding: '1px 6px', borderRadius: 4, minWidth: 32, textAlign: 'center' }}>{port}</code>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>{desc}</span>
            {rec && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>← use this first</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, outline: 'none', background: '#fff' }}
      />
    </div>
  );
}

const btnStyle = (disabled) => ({
  fontSize: 14, fontWeight: 500,
  background: disabled ? '#9ca3af' : '#111', color: '#fff',
  border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
});
