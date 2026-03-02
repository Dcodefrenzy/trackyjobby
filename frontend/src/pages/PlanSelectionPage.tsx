import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Target } from 'lucide-react';
import './LandingPage.css'; // Reuse glassmorphism styles

const PlanSelectionPage: React.FC = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSelectPlan = async (planId: string) => {
        setLoading(planId);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/payment/create-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId })
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to create payment session');
            }
        } catch (err: any) {
            console.error('❌ [PLAN] Selection error:', err);
            setError(err.message);
            setLoading(null);
        }
    };

    return (
        <div className="landing-page">
            <nav className="nav-container">
                <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <Target className="logo-icon" size={24} />
                    <span>TrackyJobby</span>
                </div>
            </nav>

            <main className="pricing-section" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="section-intro">
                    <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Start your 3-day free trial</h1>
                    <p className="section-subtitle">Choose a plan to continue to your dashboard. You won't be charged until day 4.</p>
                </div>

                {error && (
                    <div style={{ color: '#ff4444', textAlign: 'center', marginBottom: '2rem', padding: '1rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid #ff4444' }}>
                        {error}
                    </div>
                )}

                <div className="pricing-grid">
                    {/* Monthly */}
                    <div className="pricing-card glass">
                        <div className="p-card-header">
                            <h3 className="p-plan">Monthly</h3>
                            <div className="p-price">€2<span>/month</span></div>
                            <p className="p-note">3 days free, then €2/mo. Cancel anytime.</p>
                        </div>
                        <ul className="p-features">
                            <li><Check size={16} /> Auto-extraction from Gmail</li>
                            <li><Check size={16} /> Application journey tracking</li>
                            <li><Check size={16} /> Real-time metrics</li>
                        </ul>
                        <button
                            className="btn-secondary-full"
                            disabled={!!loading}
                            onClick={() => handleSelectPlan('monthly')}
                        >
                            {loading === 'monthly' ? 'Loading...' : 'Start 3-Day Free Trial'}
                        </button>
                    </div>

                    {/* Yearly */}
                    <div className="pricing-card glass popular">
                        <div className="popular-badge">Best Value</div>
                        <div className="p-card-header">
                            <h3 className="p-plan">Yearly</h3>
                            <div className="p-price">€15<span>/year</span></div>
                            <p className="p-note">3 days free, then €15/yr. Save 37%.</p>
                        </div>
                        <ul className="p-features">
                            <li><Check size={16} /> Everything in Monthly</li>
                            <li><Check size={16} /> Best value for most users</li>
                            <li><Check size={16} /> Priority support</li>
                        </ul>
                        <button
                            className="btn-primary-full"
                            disabled={!!loading}
                            onClick={() => handleSelectPlan('yearly')}
                        >
                            {loading === 'yearly' ? 'Loading...' : 'Start 3-Day Free Trial'}
                        </button>
                    </div>

                    {/* Lifetime */}
                    <div className="pricing-card glass coming-soon">
                        <div className="p-card-header">
                            <h3 className="p-plan">Lifetime</h3>
                            <div className="p-price">Coming Soon</div>
                            <p className="p-note">Full access forever. Stay tuned!</p>
                        </div>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Secure payment processing by Stripe.
                </p>
            </main>
        </div>
    );
};

export default PlanSelectionPage;
