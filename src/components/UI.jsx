import React, { useState, useRef, useEffect } from 'react';

/* ── Spinner ────────────────────────────────────────────────────────────── */
export function Spinner({ size = 14, color = 'var(--text-3)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--border)`,
      borderTopColor: color,
      animation: 'spin 0.65s linear infinite',
      flexShrink: 0,
    }} />
  );
}

/* ── Tooltip ────────────────────────────────────────────────────────────── */
export function Tooltip({ content, children, maxWidth = 260 }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const ref = useRef();

  function handleEnter() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
    setOpen(true);
  }

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={handleEnter} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && (
        <span style={{
          position: 'fixed', top: pos.top, left: pos.left,
          transform: 'translateX(-50%)',
          background: 'var(--text)', color: '#fff',
          fontSize: 12, lineHeight: 1.5, padding: '7px 11px',
          borderRadius: 'var(--r-sm)', maxWidth, zIndex: 9999,
          pointerEvents: 'none', boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.15s ease both',
          whiteSpace: 'normal', textAlign: 'center',
        }}>{content}</span>
      )}
    </span>
  );
}

/* ── InfoIcon (?) with tooltip ──────────────────────────────────────────── */
export function InfoIcon({ text }) {
  return (
    <Tooltip content={text} maxWidth={280}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 15, height: 15, borderRadius: '50%',
        background: 'var(--bg-3)', border: '1px solid var(--border-2)',
        fontSize: 9, fontWeight: 700, color: 'var(--text-3)',
        cursor: 'help', flexShrink: 0, marginLeft: 4,
        userSelect: 'none',
      }}>?</span>
    </Tooltip>
  );
}

/* ── StatusBadge ────────────────────────────────────────────────────────── */
export function StatusBadge({ status, compact = false }) {
  const map = {
    ok:      { label: 'Pass',     bg: 'var(--ok-bg)',   color: 'var(--ok)',   border: 'var(--ok-bdr)',   dot: '#16a34a' },
    warn:    { label: 'Warning',  bg: 'var(--warn-bg)', color: 'var(--warn)', border: 'var(--warn-bdr)', dot: '#ca8a04' },
    fail:    { label: 'Failed',   bg: 'var(--fail-bg)', color: 'var(--fail)', border: 'var(--fail-bdr)', dot: '#dc2626' },
    loading: { label: 'Checking', bg: 'var(--bg-2)',    color: 'var(--text-3)', border: 'var(--border)', dot: 'var(--text-3)' },
    idle:    { label: '—',        bg: 'var(--bg-2)',    color: 'var(--text-3)', border: 'var(--border)', dot: 'var(--border-2)' },
    error:   { label: 'Error',    bg: 'var(--fail-bg)', color: 'var(--fail)', border: 'var(--fail-bdr)', dot: '#dc2626' },
  };
  const s = map[status] || map.idle;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: compact ? 4 : 5,
      fontSize: compact ? 11 : 11.5, fontWeight: 600,
      padding: compact ? '2px 7px' : '3px 9px',
      borderRadius: 99, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, lineHeight: 1.4,
      whiteSpace: 'nowrap', letterSpacing: '0.01em',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0,
        animation: status === 'loading' ? 'pulse 1.2s ease infinite' : 'none',
      }} />
      {s.label}
    </span>
  );
}

/* ── SeverityTag ────────────────────────────────────────────────────────── */
export function SeverityTag({ level }) {
  const map = {
    critical: { label: 'Critical',    bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    high:     { label: 'High',        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    medium:   { label: 'Medium',      bg: '#fefce8', color: '#92400e', border: '#fde68a' },
    low:      { label: 'Low',         bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    info:     { label: 'Info',        bg: 'var(--info-bg)', color: 'var(--info)', border: 'var(--info-bdr)' },
  };
  const s = map[level] || map.info;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>{s.label}</span>
  );
}

/* ── CopyButton ─────────────────────────────────────────────────────────── */
export function CopyButton({ value, label = 'Copy', size = 'sm' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }
  const pad = size === 'sm' ? '5px 12px' : '8px 18px';
  const fs  = size === 'sm' ? 12 : 13;
  return (
    <button onClick={copy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, fontSize: fs, fontWeight: 500, border: 'none', cursor: 'pointer',
      borderRadius: 'var(--r-sm)', fontFamily: 'var(--font)', transition: 'all 0.15s',
      background: copied ? 'var(--ok)' : 'var(--text)',
      color: '#fff',
    }}>
      {copied ? '✓ Copied' : `⎘ ${label}`}
    </button>
  );
}

/* ── DifficultyBar ──────────────────────────────────────────────────────── */
export function DifficultyBar({ level }) {
  const map = { easy: 1, medium: 2, hard: 3 };
  const n   = map[level] || 1;
  const colors = ['#16a34a', '#ca8a04', '#dc2626'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3].map(i => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: 2,
          background: i <= n ? colors[n-1] : 'var(--border)',
          transition: 'background 0.2s',
        }} />
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>
        {level === 'easy' ? 'Easy fix' : level === 'medium' ? 'Moderate' : 'Requires expertise'}
      </span>
    </span>
  );
}

/* ── Section divider ────────────────────────────────────────────────────── */
export function Divider({ color = 'var(--border)', my = 16 }) {
  return <div style={{ height: 1, background: color, margin: `${my}px 0` }} />;
}

/* ── Logo mark ──────────────────────────────────────────────────────────── */
export function LogoMark({ size = 26 }) {
  return (
    <div style={{
      width: size, height: size, background: 'var(--text)',
      borderRadius: Math.round(size * 0.28),
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#fff" strokeWidth="1.2" strokeDasharray="2.5 1.8"/>
        <circle cx="7" cy="7" r="2" fill="var(--accent)"/>
      </svg>
    </div>
  );
}
