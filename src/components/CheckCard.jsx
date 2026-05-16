import React from 'react';

const STATUS = {
  ok:      { color: 'var(--green)',  bg: 'var(--green-bg)',  label: '✓ Pass'    },
  warn:    { color: 'var(--yellow)', bg: 'var(--yellow-bg)', label: '⚠ Warning' },
  fail:    { color: 'var(--red)',    bg: 'var(--red-bg)',    label: '✕ Failed'  },
  loading: { color: 'var(--gray)',   bg: 'var(--gray-bg)',   label: 'Checking…' },
  idle:    { color: 'var(--gray)',   bg: 'var(--gray-bg)',   label: 'Pending'   },
};

export default function CheckCard({ icon, title, status = 'idle', detail, fix }) {
  const s = STATUS[status] || STATUS.idle;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: var(--radius),
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{title}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 9px',
          borderRadius: 99, background: s.bg, color: s.color,
        }}>
          {s.label}
        </span>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray)', fontSize: 13 }}>
          <Spinner /> Checking...
        </div>
      )}

      {detail && status !== 'loading' && (
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{detail}</p>
      )}

      {fix && (
        <div style={{
          marginTop: 4, padding: '8px 10px',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 6, fontSize: 12, color: '#92400e', lineHeight: 1.5,
        }}>
          <strong>Fix: </strong>{fix}
        </div>
      )}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{
      width: 13, height: 13, borderRadius: '50%',
      border: '2px solid #e5e7eb',
      borderTopColor: '#6b7280',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// Inject keyframes once
if (!document.getElementById('sitediag-spin')) {
  const style = document.createElement('style');
  style.id = 'sitediag-spin';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
