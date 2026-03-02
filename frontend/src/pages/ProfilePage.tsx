import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, LogOut, Copy, ExternalLink, ShieldCheck, MailWarning, ArrowLeft, CreditCard, Loader2, Settings } from 'lucide-react';
import { createPortalSession, getForwardingVerification } from '../api/client';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [verificationUrl, setVerificationUrl] = useState<string | null>(null);


    // Poll for Gmail verification link if instructions are open
    useEffect(() => {
        let interval: any;

        const checkVerification = () => {
            getForwardingVerification()
                .then(data => {
                    if (data.verificationUrl) {
                        setVerificationUrl(data.verificationUrl);
                    }
                })
                .catch(() => { /* Silent fail while polling */ });
        };

        // Initial check
        checkVerification();

        // Polling every 5 seconds
        interval = setInterval(checkVerification, 5000);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

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
        } catch (err: any) {
            console.error("Failed to open portal:", err.response?.data || err);
            const errorMsg = err.response?.data?.error || "Please try again later.";

            if (errorMsg.includes("No active subscription")) {
                if (window.confirm("You haven't started a subscription yet. Would you like to view our plans?")) {
                    navigate('/plan-selection');
                }
            } else {
                alert(`Could not open billing portal: ${errorMsg}`);
            }
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

            {verificationUrl && (
                <div className="verification-alert animate-fade-in" style={{
                    background: 'rgba(255, 171, 0, 0.1)',
                    border: '1px solid #ffab00',
                    color: '#ffab00',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <ShieldCheck size={32} style={{ marginBottom: '0.75rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Gmail Verification Received!</h3>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.9 }}>
                        We found the confirmation link from Google. Click below to finalize your forwarding:
                    </p>
                    <a
                        href={verificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="primary-btn"
                        style={{ display: 'inline-flex', padding: '0.6rem 1.2rem', textDecoration: 'none' }}
                        onClick={() => setVerificationUrl(null)}
                    >
                        Confirm Forwarding
                    </a>
                </div>
            )}

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
                                <div className="gmail-setup-guide" style={{ fontSize: '0.875rem' }}>
                                    <div className="setup-part" style={{ marginBottom: '1.5rem' }}>
                                        <div className="tutorial-visual" style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <img
                                                src="https://storage.googleapis.com/support-kms-prod/Cm6cYtX7pQvTaMzx3ADskquczoegpK3vShee"
                                                alt="Gmail Forwarding Tutorial"
                                                style={{ width: '100%', display: 'block', height: 'auto' }}
                                            />
                                        </div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Set up forwarding:</p>
                                        <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <li>Open <strong>Gmail settings</strong> &gt; <strong>See all settings</strong>.</li>
                                            <li>Go to <strong>Forwarding and POP/IMAP</strong>.</li>
                                            <li>Click <strong>Add a forwarding address</strong>.</li>
                                            <li>Enter <code>{user.forwardingEmail}</code> and click <strong>Next</strong>.</li>
                                            <li>Stay on this page until you see the verification link above.</li>
                                        </ol>
                                    </div>
                                    <div style={{ background: 'rgba(255,171,0,0.05)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: '#ffab00', marginBottom: '1rem' }}>
                                        <MailWarning size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        <span>After adding the address, stay on this page. The verification link will appear at the top.</span>
                                    </div>

                                    {verificationUrl && (
                                        <div className="setup-part" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                                            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                PART 2 — Create the Job Filter
                                                <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>OPTIONAL</span>
                                            </p>
                                            <ol style={{ paddingLeft: '1.25rem' }}>
                                                <li>In Gmail, click the search bar filter icon.</li>
                                                <li>
                                                    Paste this in <strong>"Has the words"</strong>:
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                                                        <code style={{ fontSize: '0.7rem', color: 'var(--primary-color)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            (subject:job OR subject:career OR subject:position OR subject:interview OR subject:offer OR recruiter OR hiring OR "job application" OR "career opportunity")
                                                        </code>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText('(subject:job OR subject:career OR subject:position OR subject:interview OR subject:offer OR recruiter OR hiring OR "job application" OR "career opportunity")');
                                                                alert('Filter copied!');
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                </li>
                                                <li>Click <strong>Create filter</strong> &gt; <strong>Forward it to</strong> &gt; select alias.</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </details>

                        <details className="step-group">
                            <summary>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/1101px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png" width="16" alt="Outlook" />
                                <span>Microsoft Outlook / Office 365</span>
                                <ExternalLink size={14} className="ml-auto" />
                            </summary>
                            <div className="step-content">
                                <div className="outlook-setup-guide" style={{ fontSize: '0.875rem' }}>
                                    <div className="setup-part" style={{ marginBottom: '1.5rem' }}>
                                        <div className="tutorial-visual" style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '16/9' }}>
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src="https://www.youtube.com/embed/XKwOvAv3Cs8"
                                                title="Outlook Forwarding Tutorial"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                style={{ display: 'block' }}
                                            ></iframe>
                                        </div>
                                        <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <li>At the top window of the new Outlook, select <strong>Settings</strong> <Settings size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.7 }} /> .</li>
                                            <li>Select <strong>Mail</strong> &gt; <strong>Forwarding</strong>.</li>
                                            <li>
                                                Toggle the <strong>Enable forwarding</strong> switch, enter the address:
                                                <div style={{ marginTop: '4px' }}><code style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{user.forwardingEmail}</code></div>
                                            </li>
                                            <li>Select <strong>Keep a copy of forwarded messages</strong> and select <strong>Save</strong>.</li>
                                        </ol>
                                    </div>
                                </div>
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
