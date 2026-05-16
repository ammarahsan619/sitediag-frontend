import React from 'react';
import { Spinner } from './CheckCard';

export default function AiSummary({ text, loading }) {
  if (!text && !loading) return null;

  return (
    <div style={{
      background: '#f8faff',
      border: '1px solid #dbeafe',
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          AI Diagnosis
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray)', fontSize: 14 }}>
          <Spinner /> Analyzing results...
        </div>
      ) : (
        <p style={{ fontSize: 14, color: '#1e3a5f', lineHeight: 1.7 }}>{text}</p>
      )}
    </div>
  );
}
