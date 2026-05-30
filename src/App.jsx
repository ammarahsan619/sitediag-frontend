import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import DiagnosticApp from './components/DiagnosticApp';
import './index.css';

export const BACKEND = 'https://sitediag-backend-production.up.railway.app';

export default function App() {
  const [view, setView]       = useState('landing');
  const [seedDomain, setSeed] = useState('');
  const [seedTab, setSeedTab] = useState('website');

  function launch(domain = '', tab = 'website') {
    setSeed(domain.trim().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,''));
    setSeedTab(tab);
    setView('tool');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return view === 'tool'
    ? <DiagnosticApp seed={seedDomain} seedTab={seedTab} onBack={() => setView('landing')} />
    : <LandingPage onLaunch={launch} />;
}
