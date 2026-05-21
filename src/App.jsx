import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import DiagnosticTool from './components/DiagnosticTool';
import './index.css';

export const BACKEND_URL = 'https://sitediag-backend-production.up.railway.app';

export default function App() {
  const [view, setView] = useState('landing');
  const [seedDomain, setSeedDomain] = useState('');

  function goToTool(domain = '') {
    setSeedDomain(domain);
    setView('tool');
    window.scrollTo({ top: 0 });
  }

  return view === 'tool'
    ? <DiagnosticTool seed={seedDomain} onBack={() => setView('landing')} />
    : <LandingPage onLaunch={goToTool} />;
}
