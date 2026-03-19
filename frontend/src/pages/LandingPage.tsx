import { useNavigate, Link } from 'react-router-dom';
import { Mail, BarChart3, ShieldCheck, ChevronRight, Zap, Target, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import './LandingPage.css';

export default function LandingPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [showExtModal, setShowExtModal] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading || user) return null;

    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav flex-between">
                <Link to="/" className="logo flex-center gap-2">
                    <Target size={24} className="text-primary" />
                    <span>TrackyJobby</span>
                </Link>
                <div className="nav-links">
                    <Link to="/auth/login" className="nav-link">Log In</Link>
                    <Link to="/auth/register" className="btn-primary-sm">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <div className="badge-glow animate-fade-in">Now in Beta — v1.0.2</div>
                    <h1 className="hero-title animate-fade-in">
                        Applications are messy.<br />
                        <span>TrackyJobby</span> tracks your life in one click.
                    </h1>
                    <p className="hero-subtitle animate-fade-in" style={{ maxWidth: '800px' }}>
                        The first universal tracker for your **career, housing, and education**. 
                        Whether it's a dream job, a new apartment, or a master's program, 
                        TrackyJobby organizes everything automatically.
                    </p>
                    <div className="hero-actions animate-fade-in">
                        <Link to="/auth/register" className="btn-primary">
                            Get Started Free <ChevronRight size={18} />
                        </Link>
                        <button 
                          onClick={() => setShowExtModal(true)} 
                          className="btn-secondary"
                        >
                          <Zap size={18} /> Get the Extension
                        </button>
                    </div>
                </div>

                {/* Dashboard Preview Overlay */}
                <div className="dashboard-preview-wrapper animate-slide-up">
                    <div className="preview-container glass">
                        <div className="preview-sidebar">
                            <div className="sidebar-dot"></div>
                            <div className="sidebar-dot"></div>
                            <div className="sidebar-dot"></div>
                        </div>
                        <div className="preview-content">
                            <div className="preview-header flex-between">
                                <div className="p-title">Your Applications</div>
                                <div className="p-badge flex-center gap-1">✨ Universal Sync</div>
                            </div>
                            <div className="preview-metrics">
                                <div className="p-metric-card glass">
                                    <div className="p-m-label">Job Apps</div>
                                    <div className="p-m-value">12</div>
                                </div>
                                <div className="p-metric-card glass">
                                    <div className="p-m-label">Housing</div>
                                    <div className="p-m-value text-info">3</div>
                                </div>
                                <div className="p-metric-card glass">
                                    <div className="p-m-label">Schools</div>
                                    <div className="p-m-value text-success">2</div>
                                </div>
                            </div>
                            <div className="preview-grid">
                                <div className="p-job-card glass active-glow">
                                    <div className="p-j-header">
                                        <div className="p-j-logo bg-purple-600">S</div>
                                        <div>
                                            <div className="p-j-company">Stripe</div>
                                            <div className="p-j-title">Software Engineer</div>
                                        </div>
                                    </div>
                                    <div className="p-j-status status-applied">Applied</div>
                                </div>
                                <div className="p-job-card glass">
                                    <div className="p-j-header">
                                        <div className="p-j-logo bg-blue-500">H</div>
                                        <div>
                                            <div className="p-j-company">Hudson Yards</div>
                                            <div className="p-j-title">2BR Apartment</div>
                                        </div>
                                    </div>
                                    <div className="p-j-status status-interview">Viewing Set</div>
                                </div>
                                <div className="p-job-card glass">
                                    <div className="p-j-header">
                                        <div className="p-j-logo bg-amber-600">U</div>
                                        <div>
                                            <div className="p-j-company">Stanford Univ.</div>
                                            <div className="p-j-title">Computer Science</div>
                                        </div>
                                    </div>
                                    <div className="p-j-status status-applied">In Review</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-intro">
                    <h2 className="section-title">Everything you need to land it</h2>
                    <p className="section-subtitle">Focus on your goals while we handle the data entry.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass">
                        <div className="feature-icon bg-info-light">
                            <Zap size={24} className="text-info" />
                        </div>
                        <h3>One-Click Extension</h3>
                        <p>Our powerful Chrome extension scans listings on any site and saves them instantly.</p>
                    </div>
                    <div className="feature-card glass">
                        <div className="feature-icon bg-success-light">
                            <Mail size={24} className="text-success" />
                        </div>
                        <h3>Universal Support</h3>
                        <p>Built-in intelligence to track Jobs, Apartments, Schools, and Scholarships.</p>
                    </div>
                    <div className="feature-card glass">
                        <div className="feature-icon bg-warning-light">
                            <BarChart3 size={24} className="text-warning" />
                        </div>
                        <h3>Visual Journey</h3>
                        <p>Beautiful timelines of every status update, from first click to signed contract.</p>
                    </div>
                    <div className="feature-card glass">
                        <div className="feature-icon bg-primary-light">
                            <ShieldCheck size={24} className="text-primary" />
                        </div>
                        <h3>Privacy First</h3>
                        <p>Your data is encrypted and secure. We track your progress, not your life.</p>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section">
                <div className="section-intro">
                    <h2 className="section-title">Simple, transparent pricing</h2>
                    <p className="section-subtitle">Choose the plan that's right for your goals.</p>
                </div>

                <div className="pricing-grid">
                    <div className="pricing-card glass">
                        <div className="p-card-header">
                            <h3 className="p-plan">Monthly</h3>
                            <div className="p-price">€2<span>/month</span></div>
                            <p className="p-note">Low-barrier, flexible recurring plan</p>
                        </div>
                        <ul className="p-features">
                            <li><Check size={16} /> Auto-extraction from Gmail</li>
                            <li><Check size={16} /> Application journey tracking</li>
                            <li><Check size={16} /> Real-time metrics</li>
                        </ul>
                    </div>

                    <div className="pricing-card glass popular">
                        <div className="popular-badge">Best Value</div>
                        <div className="p-card-header">
                            <h3 className="p-plan">Yearly</h3>
                            <div className="p-price">€15<span>/year</span></div>
                            <p className="p-note">~37.5% discount vs monthly</p>
                        </div>
                        <ul className="p-features">
                            <li><Check size={16} /> Everything in Monthly</li>
                            <li><Check size={16} /> Best value for most users</li>
                            <li><Check size={16} /> Priority support</li>
                        </ul>
                    </div>

                    <div className="pricing-card glass coming-soon">
                        <div className="p-card-header">
                            <h3 className="p-plan">Lifetime</h3>
                            <div className="p-price">Coming Soon</div>
                            <p className="p-note">Full access forever, one-time payment. Stay tuned!</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-card glass">
                    <h2>Ready to land that offer?</h2>
                    <p>Join hundreds of people managing their applications seamlessly with TrackyJobby.</p>
                    <Link to="/auth/register" className="btn-primary">
                        Start Tracking
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content flex-between">
                    <div className="logo-footer flex-center gap-2">
                        <Target size={20} className="text-primary" />
                        <span>TrackyJobby</span>
                    </div>
                    <div className="footer-links gap-8 flex-center">
                        <Link to="/privacy">Privacy</Link>
                        <a href="#">Terms</a>
                        <a href="mailto:hello@trackyjobby.com">Contact</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    &copy; 2026 TrackyJobby. All rights reserved.
                </div>
            </footer>
            {/* Extension Modal */}
            {showExtModal && (
                <div className="ext-modal-overlay" onClick={() => setShowExtModal(false)}>
                    <div className="ext-modal glass" onClick={e => e.stopPropagation()}>
                        <div className="ext-modal-icon">
                            <Zap size={32} className="text-warning" />
                        </div>
                        <h3>Extension Coming Soon! 🚀</h3>
                        <p>
                            Our Chrome Extension is currently undergoing final review with the Google Web Store team. 
                            <strong> Stay tuned!</strong> Very soon, you'll be able to track and organize your 
                            bookmarked applications with just one click.
                        </p>
                        <button 
                            className="btn-primary-sm" 
                            onClick={() => setShowExtModal(false)}
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
