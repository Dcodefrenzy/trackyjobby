import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, LogOut, Copy, ExternalLink, ShieldCheck, MailWarning, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { createPortalSession } from '../api/client';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    // No logic needed here for portal return as it now redirects to dashboard

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
    };

    const handleManageSubscription = async () => {
        try {
            setIsPortalLoading(true);
            const { url } = await createPortalSession();
            window.open(url, '_blank');
        } catch (err) {
            console.error("Failed to open portal:", err);
            alert("Could not open billing portal. Please try again later.");
        } finally {
            setIsPortalLoading(false);
        }
    };

    const copyAlias = () => {
        if (user?.forwardingEmail) {
            navigator.clipboard.writeText(user.forwardingEmail);
            alert('Forwarding alias copied to clipboard!');
        }
    };

    if (!user) return null;

    return (
        <div className="profile-container animate-fade-in">
            <button className="back-btn-corner" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
                <ArrowLeft size={24} />
            </button>

            <div className="profile-header">
                <h1>Profile Settings</h1>
                <p>Manage your account and email forwarding configuration</p>
            </div>

            <div className="profile-grid">
                {/* Account Section */}
                <div className="profile-card profile-info-card">
                    <div className="card-header">
                        <User size={20} className="text-primary" />
                        <h3>Account Identity</h3>
                    </div>
                    <div className="info-content">
                        <div className="info-item">
                            <label>Full Name</label>
                            <div className="value">{user.name || 'Anonymous User'}</div>
                        </div>
                        <div className="info-item">
                            <label>Primary Email</label>
                            <div className="value">{user.email}</div>
                        </div>
                        <div className="info-item">
                            <label>Account Since</label>
                            <div className="value">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>

                {/* Subscription Section */}
                <div className="profile-card subscription-card">
                    <div className="card-header">
                        <CreditCard size={20} className="text-primary" />
                        <h3>Subscription & Billing</h3>
                    </div>
                    <div className="subscription-info">
                        <div className="info-item">
                            <label>Current Plan</label>
                            <div className="value" style={{ textTransform: 'capitalize' }}>
                                {user.subscription_status === 'trialing' ? 'Free Trial (3 Days)' :
                                    user.subscription_status === 'active' ? 'Full Subscription' :
                                        user.subscription_status === 'lifetime' ? 'Lifetime Access' : 'No Active Plan'}
                            </div>
                        </div>
                        <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
                            Manage your payment methods, download invoices, or cancel your subscription securely through Stripe.
                        </p>
                    </div>
                    {user.subscription_status !== 'lifetime' && (
                        <button
                            className="portal-btn"
                            onClick={handleManageSubscription}
                            disabled={isPortalLoading}
                        >
                            {isPortalLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <ExternalLink size={16} />
                            )}
                            Manage Billing & Cancellation
                        </button>
                    )}
                    {user.subscription_status === 'lifetime' && (
                        <div className="lifetime-badge">
                            <ShieldCheck size={16} />
                            <span>Lifetime Hero</span>
                        </div>
                    )}
                </div>

                {/* Forwarding Section */}
                <div className="profile-card alias-card">
                    <div className="card-header">
                        <ShieldCheck size={20} className="text-success" />
                        <h3>Main Tracking Alias</h3>
                    </div>
                    <p className="text-muted text-sm">
                        Use this address as your destination for manual or automatic email forwarding.
                    </p>
                    <div className="alias-display">
                        <code>{user.forwardingEmail}</code>
                        <button className="copy-btn" onClick={copyAlias} aria-label="Copy Alias">
                            <Copy size={16} />
                        </button>
                    </div>
                    <div className="status-indicator">
                        <div className="status-dot success"></div>
                        <span>Tracking System Active</span>
                    </div>
                </div>

                {/* Setup Instructions Section */}
                <div className="profile-card instructions-card">
                    <div className="card-header">
                        <Mail size={20} className="text-primary" />
                        <h3>Multi-Provider Forwarding</h3>
                    </div>
                    <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                        You can forward emails from multiple providers at once. Just use your unique alias above.
                    </p>

                    <div className="manual-steps">
                        <details className="step-group">
                            <summary>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" width="16" alt="Gmail" />
                                <span>Gmail Settings</span>
                                <ExternalLink size={14} className="ml-auto" />
                            </summary>
                            <div className="step-content">
                                <ol>
                                    <li>Open <strong>Gmail Settings</strong> &gt; <strong>Forwarding</strong>.</li>
                                    <li>Click <strong>Add a forwarding address</strong>.</li>
                                    <li>Paste your alias and verify the link on your <a href="/dashboard">Dashboard</a>.</li>
                                </ol>
                            </div>
                        </details>

                        <details className="step-group">
                            <summary>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/1101px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png" width="16" alt="Outlook" />
                                <span>Microsoft Outlook / Office 365</span>
                                <ExternalLink size={14} className="ml-auto" />
                            </summary>
                            <div className="step-content">
                                <ol>
                                    <li>Open <strong>Outlook Web Settings</strong> &gt; <strong>Mail</strong> &gt; <strong>Forwarding</strong>.</li>
                                    <li>Select <strong>Enable forwarding</strong>.</li>
                                    <li>Enter your TrackyJobby alias and click <strong>Save</strong>.</li>
                                </ol>
                            </div>
                        </details>

                        <details className="step-group">
                            <summary>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Mail_%28iOS%29.svg" width="16" alt="Apple Mail" />
                                <span>Apple Mail / iCloud</span>
                                <ExternalLink size={14} className="ml-auto" />
                            </summary>
                            <div className="step-content">
                                <ol>
                                    <li>Log in to <strong>iCloud.com</strong> and open <strong>Mail</strong>.</li>
                                    <li>Click the <strong>Gear icon</strong> &gt; <strong>Preferences</strong> &gt; <strong>Forwarding</strong>.</li>
                                    <li>Check <strong>Forward my email to</strong> and enter your alias.</li>
                                </ol>
                            </div>
                        </details>
                    </div>

                    <div className="warning-box">
                        <MailWarning size={16} />
                        <span>Emails from these providers will now show up automatically in your dashboard.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
