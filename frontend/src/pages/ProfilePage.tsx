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

    const [filterOptions, setFilterOptions] = useState({
        job: true,
        career: true,
        interview: true,
        offer: true,
        recruiter: true,
        application: true
    });
    const [customKeywords, setCustomKeywords] = useState('');

    const getFilterString = () => {
        const terms = [];
        if (filterOptions.job) terms.push('subject:job');
        if (filterOptions.career) terms.push('subject:career');
        if (filterOptions.interview) terms.push('subject:interview');
        if (filterOptions.offer) terms.push('subject:offer');
        if (filterOptions.recruiter) terms.push('recruiter', 'hiring');
        if (filterOptions.application) terms.push('"job application"', '"career opportunity"');

        if (customKeywords.trim()) {
            const keywords = customKeywords.split(',').map(k => k.trim()).filter(k => k);
            terms.push(...keywords);
        }

        return terms.length > 0 ? `(${terms.join(' OR ')})` : '';
    };

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

                                        <div className="safe-forwarding-notice" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '1rem' }}>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--info-color)', marginBottom: '4px', fontSize: '0.85rem' }}>
                                                <ShieldCheck size={16} /> Privacy First: Action Required
                                            </p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                                                Adding an alias <strong>does not</strong> start forwarding. Gmail disables global forwarding by default. After verifying, you will create a filter to selectively forward only job emails.
                                            </p>
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
                                                PART 2 — Create Job Filter (Required)
                                            </p>
                                            <div className="warning-note" style={{ fontSize: '0.8rem', color: '#ffab00', marginBottom: '1rem', display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,171,0,0.05)', borderRadius: '6px' }}>
                                                <MailWarning size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <span><strong>Important:</strong> Global forwarding is disabled by default in Gmail even after confirming. You MUST set up a filter to actually forward your job emails!</span>
                                            </div>
                                            <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', opacity: 0.8 }}>
                                                Select what kinds of emails you want to forward to TrackyJobby:
                                            </p>

                                            <div className="filter-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={filterOptions.job} onChange={e => setFilterOptions({ ...filterOptions, job: e.target.checked })} /> Job
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={filterOptions.career} onChange={e => setFilterOptions({ ...filterOptions, career: e.target.checked })} /> Career
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={filterOptions.interview} onChange={e => setFilterOptions({ ...filterOptions, interview: e.target.checked })} /> Interview
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={filterOptions.offer} onChange={e => setFilterOptions({ ...filterOptions, offer: e.target.checked })} /> Offer
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={filterOptions.recruiter} onChange={e => setFilterOptions({ ...filterOptions, recruiter: e.target.checked })} /> Recruiter / Hiring
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={filterOptions.application} onChange={e => setFilterOptions({ ...filterOptions, application: e.target.checked })} /> Application terms
                                                </label>
                                            </div>
                                            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                                <input
                                                    type="text"
                                                    value={customKeywords}
                                                    onChange={(e) => setCustomKeywords(e.target.value)}
                                                    placeholder="Add custom keywords (comma separated)"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '6px',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.875rem'
                                                    }}
                                                />
                                            </div>

                                            <ol style={{ paddingLeft: '1.25rem' }}>
                                                <li>In Gmail, click the search bar filter icon.</li>
                                                <li>
                                                    Paste this in <strong>"Has the words"</strong>:
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                                                        <code style={{ fontSize: '0.7rem', color: 'var(--primary-color)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {getFilterString()}
                                                        </code>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(getFilterString());
                                                                alert('Filter copied!');
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                </li>
                                                <li>Click <strong>Create filter</strong> &gt; <strong>Forward it to</strong> &gt; select alias.</li>
                                                <li>Click <strong>Create filter</strong>.</li>
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
                                        <div className="safe-forwarding-notice" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--info-color)', marginBottom: '4px', fontSize: '0.85rem' }}>
                                                <ShieldCheck size={16} /> Privacy First: Stay in Control
                                            </p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                                                Don't want to forward all your emails? <strong>You don't have to!</strong> Instead of setting up global forwarding, you can use <strong>Outlook Rules</strong> to only forward emails that match job-related keywords (like "Job offer", "Interview", etc.) to your TrackyJobby alias.
                                            </p>
                                        </div>
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
                                <div className="apple-setup-guide" style={{ fontSize: '0.875rem' }}>
                                    <div className="setup-part" style={{ marginBottom: '1.5rem' }}>
                                        <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <li>Go to icloud.com/mail, then sign in to your Apple Account (if necessary).</li>
                                            <li>Select the <strong>Settings</strong> button at the top of the Mailboxes list, then choose <strong>Settings</strong>.</li>
                                            <li>Select <strong>Mail Forwarding</strong> in the sidebar.</li>
                                            <li>
                                                Select the “Forward my email to” checkbox, then type the forwarding address in the text field:
                                                <div style={{ marginTop: '4px' }}><code style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{user.forwardingEmail}</code></div>
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </details>

                        <details className="step-group">
                            <summary>
                                <Mail size={16} />
                                <span>Other Providers</span>
                                <ExternalLink size={14} className="ml-auto" />
                            </summary>
                            <div className="step-content">
                                <div className="other-setup-guide" style={{ fontSize: '0.875rem' }}>
                                    <div className="setup-part" style={{ marginBottom: '1.5rem' }}>
                                        <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <li>Log in to your email provider and navigate to <strong>Settings</strong> or <strong>Preferences</strong>.</li>
                                            <li>Look for a <strong>Forwarding</strong> or <strong>Filters</strong> section.</li>
                                            <li>
                                                Set up a forwarding rule to redirect job-related emails or all emails to:
                                                <div style={{ marginTop: '4px' }}><code style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{user.forwardingEmail}</code></div>
                                            </li>
                                        </ol>
                                    </div>
                                </div>
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
