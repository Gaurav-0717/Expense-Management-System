import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import Login from './component/login/login';
import Signup from './component/signup/signup';
import Navbar from './component/Navbar/navbar';
import ErrorBoundary from './component/ErrorBoundary';
import API_BASE_URL from './config/api';
import './App.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('dashboard');
  const [, setTheme] = useState('light');

  const handleNavigate = useCallback((id) => setView(id), []);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok) {
          setProfile(json.user);
          setIsLoggedIn(true);
          if (json.user.theme) {
            setTheme(json.user.theme);
            document.documentElement.setAttribute('data-theme', json.user.theme);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        console.error('Profile fetch failed');
      }
    })();
  }, []);

  const handleLogin = useCallback(async () => {
    setIsLoggedIn(true);
    // Try to read profile stored by Login component in localStorage
    const raw = localStorage.getItem('profile');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProfile(parsed);
        if (parsed.theme) {
          setTheme(parsed.theme);
          document.documentElement.setAttribute('data-theme', parsed.theme);
        }
        return;
      } catch { /* fallthrough to fetch */ }
    }
    // If profile not available locally, fetch from API using token
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); 
      if (res.ok) {
        setProfile(json.user);
        if (json.user.theme) {
          setTheme(json.user.theme);
          document.documentElement.setAttribute('data-theme', json.user.theme);
        }
      }
    } catch (err) { console.error('profile fetch after login failed', err); }
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('profile');
  }, []);

  const settingsPanel = useMemo(() => (
    <SettingsPage profile={profile} onProfileUpdate={(u) => {
      setProfile(u);
      if (u.theme) {
        setTheme(u.theme);
        document.documentElement.setAttribute('data-theme', u.theme);
        localStorage.setItem('theme', u.theme);
      }
    }} />
  ), [profile]);

  if (isLoggedIn) {
    return (
      <ErrorBoundary>
        <div>
          <Navbar onLogout={handleLogout} onNavigate={handleNavigate} />
          <Suspense fallback={<div className="loading-state">Loading page…</div>}>
            {view === 'dashboard' && <DashboardPage onLogout={handleLogout} profile={profile} />}
            {view === 'analysis' && <AnalysisPage />}
            {view === 'contact' && <ContactPage />}
            {view === 'help' && <HelpPage />}
            {view === 'settings' && settingsPanel}
          </Suspense>
        </div>
      </ErrorBoundary>
    );
  }

  return showSignup ? (
    <Signup onSignup={handleLogin} switchToLogin={() => setShowSignup(false)} />
  ) : (
    <Login onLogin={handleLogin} switchToSignup={() => setShowSignup(true)} />
  );
};

export default App;
