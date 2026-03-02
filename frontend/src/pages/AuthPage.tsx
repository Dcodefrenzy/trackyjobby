import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Sun, Moon } from 'lucide-react';
import './AuthPage.css';

import { login as apiLogin, register as apiRegister } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine mode from the current URL path (/auth/login or /auth/register)
    const mode = location.pathname.includes('register') ? 'register' : 'login';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    // Theme Toggle State
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
        setIsDark(!isLightMode);
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.removeAttribute('data-theme');
            setIsDark(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                await apiRegister(email, password, name);
                setRegistered(true);
            } else {
                const data = await apiLogin(email, password);

                // Set the token context globally
                await login(data.token);

                if (data.needsSetup) {
                    navigate('/setup/email-client');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (registered) {
        return (
            <div className="auth-container animate-fade-in">
                <button onClick={toggleTheme} className="auth-theme-toggle" aria-label="Toggle Theme">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="auth-card">
                    <div className="flex-center" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        <Mail size={48} strokeWidth={1} />
                    </div>
                    <h1>Check your inbox</h1>
                    <p style={{ lineHeight: 1.6 }}>
                        We sent a verification link to <strong>{email}</strong>.
                        Click it to activate your account and configure your forwarding options.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '1rem' }}>
                        Didn't receive it? Check your spam folder.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container animate-fade-in">
            <button onClick={toggleTheme} className="auth-theme-toggle" aria-label="Toggle Theme">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="auth-card">
                <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
                <p>{mode === 'login' ? 'Sign in to track your applications' : 'Start tracking jobs like a pro'}</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'register' && (
                        <input
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && <div className="error-text text-danger" style={{ fontSize: '0.875rem' }}>{error}</div>}

                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {mode === 'login' ? (
                        <>New to TrackyJobby? <Link to="/auth/register" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Create an account</Link></>
                    ) : (
                        <>Already have an account? <Link to="/auth/login" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Sign in</Link></>
                    )}
                </div>
            </div>
        </div>
    );
}
