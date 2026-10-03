import React, { useState } from 'react';
import "./login.css";

const Login = ({ onLogin, switchToSignup }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return alert('Please fill all fields');
        setLoading(true);
        try {
                        const res = await fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('isLoggedIn', 'true');
                                // fetch profile to populate app state
                                try {
                                    const p = await fetch('http://127.0.0.1:5000/api/profile', { headers: { Authorization: `Bearer ${data.token}` } });
                                    const pj = await p.json();
                                    if (p.ok) {
                                        // store minimal profile
                                        localStorage.setItem('profile', JSON.stringify(pj.user));
                                    }
                                } catch (e) { console.error('profile fetch failed', e); }
                                // notify app and ensure it loads the fresh profile
                                await onLogin();
            } else {
                alert(data.message || 'Login failed');
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
                <h2>Sign in</h2>
                <label>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />

                <label>Password</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Your password" />

                <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>

                <p className="muted">Don't have an account? <button type="button" className="link-btn" onClick={switchToSignup}>Sign up</button></p>
            </form>
        </div>
    );
};

export default Login;
