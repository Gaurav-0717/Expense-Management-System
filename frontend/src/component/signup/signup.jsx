import React, { useState } from 'react';
import API_BASE_URL from '../../config/api';
import './signup.css';

const Signup = ({ switchToLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return alert('Please fill all fields');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      // Debug: log raw response for easier diagnosis of 400 errors
      const rawText = await res.text();
      console.log('Signup response status:', res.status);
      console.log('Signup raw response:', rawText);
      let data;
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
      if (res.ok) {
  // After creating an account, send the user to the login page to sign in
  // Clear any leftover profile in localStorage to avoid showing stale data
  localStorage.removeItem('profile');
  alert('Account created successfully. Please sign in.');
  switchToLogin();
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2>Create account</h2>
        <label>Name</label>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Your name" />

        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />

        <label>Password</label>
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" />

        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Sign up'}</button>

        <p className="muted">Already have an account? <button type="button" className="link-btn" onClick={switchToLogin}>Sign in</button></p>
      </form>
    </div>
  );
};

export default Signup;
