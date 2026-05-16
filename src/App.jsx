import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import DiagnosticTool from './components/DiagnosticTool';
import './index.css';

export const BACKEND_URL = 'https://sitediag-backend-production.up.railway.app';

export default function App() {
  const [showTool, setShowTool] = useState(false);
  const [initialDomain, setInitialDomain] = useState('');

  function handleLaunch(domain = '') {
    setInitialDomain(domain);
    setShowTool(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  function handleBack() {
    setShowTool(false);
    setInitialDomain('');
  }

  return showTool
    ? <DiagnosticTool initialDomain={initialDomain} onBack={handleBack} />
    : <LandingPage onLaunch={handleLaunch} />;
}
