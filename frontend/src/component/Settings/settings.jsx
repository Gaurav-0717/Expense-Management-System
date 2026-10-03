import React, { useState } from 'react';
import { User, Mail, DollarSign, Palette, Save, Trash2 } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import './settings.css';

const Settings = ({ profile, onProfileUpdate }) => {
  const p = profile || JSON.parse(localStorage.getItem('profile') || '{}');
  const [name, setName] = useState(p.name || '');
  const [email, setEmail] = useState(p.email || '');
  const [monthlyIncome, setMonthlyIncome] = useState(p.monthlyIncome || 0);
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage, DOM attribute, or profile
    const savedTheme = localStorage.getItem('theme');
    const domTheme = document.documentElement.getAttribute('data-theme');
    return savedTheme || domTheme || p.theme || 'light';
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const updated = { ...p, name, email, monthlyIncome, theme };
    localStorage.setItem('profile', JSON.stringify(updated));
    if (onProfileUpdate) onProfileUpdate(updated);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, email, monthlyIncome: Number(monthlyIncome), theme })
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.user) {
          localStorage.setItem('profile', JSON.stringify(json.user));
          if (onProfileUpdate) onProfileUpdate(json.user);
          alert('Profile saved successfully!');
          return;
        }
      } catch (e) {
        console.error('Profile save failed', e);
        alert('Saved locally, but server update failed');
        return;
      }
    }
    alert('Profile saved locally');
    setLoading(false);
  };

  const deleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/account`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (res.ok) {
          alert('Account deleted successfully. You will be logged out.');
          localStorage.clear();
          window.location.reload();
        } else {
          alert(data.message || 'Failed to delete account');
        }
      } catch (err) {
        console.error('Account deletion error:', err);
        alert('Server error. Please try again later.');
      }
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2><User size={24} /> Account Settings</h2>
        <p className="settings-subtitle">Manage your profile, preferences, and account security</p>
      </div>

      <div className="settings-grid">
        {/* Profile Information */}
        <div className="settings-section">
          <h3><User size={20} /> Profile Information</h3>
          <div className="card">
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <User size={16} />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="income">Monthly Income (₹)</label>
              <div className="input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  id="income"
                  type="number"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)}
                  placeholder="Enter your monthly income in rupees"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="settings-section">
          <h3><Palette size={20} /> Preferences</h3>
          <div className="card">
            <div className="preference-item">
              <div className="preference-info">
                <Palette size={16} />
                <div>
                  <label htmlFor="theme">Theme</label>
                  <p className="preference-description">Choose your preferred color scheme</p>
                </div>
              </div>
              <select
                id="theme"
                value={theme}
                onChange={e => {
                  const newTheme = e.target.value;
                  setTheme(newTheme);
                  // Apply theme immediately
                  document.documentElement.setAttribute('data-theme', newTheme);
                  localStorage.setItem('theme', newTheme);
                }}
                className="theme-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="settings-section">
          <h3>Account Actions</h3>
          <div className="card">
            <div className="account-stats">
              <div className="stat">
                <h4>Total Expenses</h4>
                <p>{p.totalExpenses || 0} entries</p>
              </div>
              <div className="stat">
                <h4>Monthly Budget</h4>
                <p>₹{monthlyIncome || 0}</p>
              </div>
            </div>
            <div className="account-actions">
              <button className="btn-primary" onClick={save} disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn-danger" onClick={deleteAccount}>
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
