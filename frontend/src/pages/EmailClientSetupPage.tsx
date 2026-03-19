import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, RefreshCcw, Send, Copy, Check, Settings, MailWarning, ShieldCheck } from 'lucide-react';
import { setupForwarder, getMe, getForwardingVerification, updateCategories } from '../api/client';
import { CATEGORIES, type CategoryId } from '../config/categories';
import { PREDEFINED_FILTERS, SUPPORTED_LANGUAGES, type LanguageCode } from '../config/filters';
import './EmailClientSetupPage.css';

type SetupStep = 'alias' | 'categories' | 'client' | 'instructions' | 'verify' | 'test';

export default function EmailClientSetupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<SetupStep>('alias');
    const [alias, setAlias] = useState('');
    const [error, setError] = useState('');
    const [client, setClient] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [mockVerifyLink, setMockVerifyLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isCheckingUser, setIsCheckingUser] = useState(true);
    const [filterLanguage, setFilterLanguage] = useState<LanguageCode>('en');
    const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(['job']);
    const [checkedFilters, setCheckedFilters] = useState<string[]>([]);
    const [isSavingCategories, setIsSavingCategories] = useState(false);
    const [customKeywords, setCustomKeywords] = useState('');

    useEffect(() => {
        // Auto-check all default filters when categories or language change
        const allChecked = selectedCategories.flatMap(cat => PREDEFINED_FILTERS[filterLanguage][cat as CategoryId]?.map(f => f.id) || []);
        setCheckedFilters(allChecked);
    }, [selectedCategories, filterLanguage]);

    const getFilterString = () => {
        const terms: string[] = [];
        
        selectedCategories.forEach(cat => {
            const filters = PREDEFINED_FILTERS[filterLanguage][cat as CategoryId] || [];
            filters.forEach(f => {
                if (checkedFilters.includes(f.id)) {
                    terms.push(...f.keywords);
                }
            });
        });

        if (customKeywords.trim()) {
            const keywords = customKeywords.split(',').map(k => k.trim()).filter(k => k);
            terms.push(...keywords);
        }

        return terms.length > 0 ? `(${terms.join(' OR ')})` : '';
    };

    useEffect(() => {
        getMe()
            .then(data => {
                if (data.enabledCategories) setSelectedCategories(data.enabledCategories);
                if (data.mail_forwarder) {
                    setAlias(data.mail_forwarder);
                    setStep('categories');
                }
            })
            .catch(err => console.error("Failed to fetch user data:", err))
            .finally(() => setIsCheckingUser(false));
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveAlias = async () => {
        setError('');
        setIsSimulating(true);
        try {
            // Strip "@trackyjobby.com" if they typed it accidentally
            const requestedAlias = alias.split('@')[0];
            const data = await setupForwarder(requestedAlias);

            // Overwrite their input with the fully clean lowercase alias returned from DB
            setAlias(data.user.mailForwarder);
            setStep('categories');
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to save alias. Try another one.');
        } finally {
            setIsSimulating(false);
        }
    };

    const handleSaveCategories = async () => {
        if (selectedCategories.length === 0) return;
        setIsSavingCategories(true);
        try {
            await updateCategories(selectedCategories, selectedCategories.includes('job') ? 'job' : selectedCategories[0]);
            setStep('client');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingCategories(false);
        }
    };

    // Poll for the Gmail verification link when the user clicks "I have added the address"
    useEffect(() => {
        let interval: any;

        if (isSimulating && step === 'instructions' && client === 'gmail') {
            interval = setInterval(() => {
                getForwardingVerification()
                    .then(data => {
                        if (data.verificationUrl) {
                            setMockVerifyLink(data.verificationUrl);
                            setIsSimulating(false);
                            setStep('verify');
                        }
                    })
                    .catch(() => {
                        // Silent fail while polling
                    });
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isSimulating, step, client]);

    const handleWaitForVerification = () => {
        setIsSimulating(true);
    };

    const handleTestForward = () => {
        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
            navigate('/dashboard');
        }, 2000);
    };

    if (isCheckingUser) {
        return (
            <div className="setup-container flex-center">
                <div className="spinner"><RefreshCcw className="spin" /></div>
            </div>
        );
    }

    return (
        <div className="setup-container animate-fade-in">
            <div className="setup-card">

                {step === 'alias' && (
                    <div className="step-content animate-fade-in">
                        <div className="icon-wrapper"><Mail size={32} /></div>
                        <h2>Create your forwarding alias</h2>
                        <p className="subtitle">This is the unique address you will forward job applications to.</p>

                        <div className="safe-forwarding-notice" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left' }}>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--info-color)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <ShieldCheck size={18} /> Privacy First: Stay in Control
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                                We know setting up email forwarding can feel anxious. <strong>We do not store your emails.</strong> Our system only extracts the tracking information (like status, company, and role) from job-related emails so you can see where you are in a particular application. We recommend setting up filters in your provider so <em>only</em> job-related emails are forwarded.
                            </p>
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="e.g. john"
                                value={alias}
                                onChange={(e) => {
                                    setAlias(e.target.value);
                                    setError('');
                                }}
                                className="forwarding-input"
                            />
                            <span className="domain-suffix">@trackyjobby.com</span>
                        </div>

                        {error && <div className="error-text text-danger" style={{ fontSize: '0.875rem', marginBottom: '1rem', marginTop: '-0.5rem' }}>{error}</div>}

                        <button
                            className="primary-btn continue-btn"
                            disabled={!alias || isSimulating}
                            onClick={handleSaveAlias}
                        >
                            {isSimulating ? <><RefreshCcw size={16} className="spin" /> Saving...</> : <>Next <ArrowRight size={16} /></>}
                        </button>
                    </div>
                )}

                {step === 'categories' && (
                    <div className="step-content animate-fade-in">
                        <h2>What do you want to track?</h2>
                        <p className="subtitle">Select the types of applications you'll be tracking. This helps us create the right email filters for you later.</p>
                        
                        <div className="filter-options" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
                            {(Object.entries(CATEGORIES) as [CategoryId, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([id, cat]) => (
                                <label key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: selectedCategories.includes(id) ? 'rgba(56, 189, 248, 0.1)' : 'var(--card-bg)', border: selectedCategories.includes(id) ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedCategories.includes(id)} 
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedCategories([...selectedCategories, id]);
                                            else setSelectedCategories(selectedCategories.filter(c => c !== id));
                                        }}
                                        style={{ accentColor: 'var(--primary-color)', width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '1rem', fontWeight: 500, color: selectedCategories.includes(id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{cat.label}</span>
                                </label>
                            ))}
                        </div>

                        <button
                            className="primary-btn continue-btn"
                            disabled={selectedCategories.length === 0 || isSavingCategories}
                            onClick={handleSaveCategories}
                        >
                            {isSavingCategories ? <><RefreshCcw size={16} className="spin" /> Saving...</> : <>Continue <ArrowRight size={16} /></>}
                        </button>
                    </div>
                )}

                {step === 'client' && (
                    <div className="step-content animate-fade-in">
                        <h2>Select your Email Client</h2>
                        <p className="subtitle">Where do you currently receive your job application emails?</p>

                        <div className="client-options">
                            {['Gmail', 'Outlook', 'Apple Mail', 'Other'].map(c => (
                                <button
                                    key={c}
                                    className={`client-btn ${client === c.toLowerCase() ? 'active' : ''}`}
                                    onClick={() => setClient(c.toLowerCase())}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <button
                            className="primary-btn continue-btn"
                            disabled={!client}
                            onClick={() => setStep('instructions')}
                        >
                            Continue <ArrowRight size={16} />
                        </button>
                        <button className="back-btn" onClick={() => setStep('alias')}>Back</button>
                    </div>
                )}

                {step === 'instructions' && (
                    <div className="step-content animate-fade-in">
                        <h2>Configure Forwarding</h2>
                        <p className="subtitle">Follow these instructions for {client === 'gmail' ? 'Gmail' : 'your client'}.</p>

                        <div className="instructions-box">
                            {client === 'gmail' ? (
                                <div className="gmail-setup-guide">
                                    <div className="setup-part">
                                        <h4>Gmail Forwarding Setup</h4>

                                        <div className="safe-forwarding-notice" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--info-color)', marginBottom: '4px', fontSize: '0.9rem' }}>
                                                <ShieldCheck size={16} /> Privacy First: Action Required
                                            </p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                                Don't worry! Adding this forwarding address <strong>does not</strong> automatically forward your emails. Gmail keeps forwarding <strong>disabled by default</strong> even after you verify. In the next step, we will guide you to create a specific filter so <em>only</em> job-related emails are sent to us.
                                            </p>
                                        </div>

                                        <div className="tutorial-visual" style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <img
                                                src="https://storage.googleapis.com/support-kms-prod/Cm6cYtX7pQvTaMzx3ADskquczoegpK3vShee"
                                                alt="Gmail Forwarding Tutorial"
                                                style={{ width: '100%', display: 'block', height: 'auto' }}
                                            />
                                        </div>

                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>Follow these steps:</p>
                                        <ol>
                                            <li>Open <strong>Gmail settings</strong> (gear icon) &gt; <strong>See all settings</strong>.</li>
                                            <li>Go to the <strong>Forwarding and POP/IMAP</strong> tab.</li>
                                            <li>Click <strong>Add a forwarding address</strong>.</li>
                                            <li>
                                                Enter your alias:
                                                <div className="copy-code-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                                                    <code className="highlight-code" style={{ margin: 0 }}>{alias}@trackyjobby.com</code>
                                                    <button
                                                        className="copy-icon-btn"
                                                        onClick={() => handleCopy(`${alias}@trackyjobby.com`)}
                                                        title="Copy to clipboard"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </li>
                                            <li>Click <strong>Next</strong> &gt; <strong>Proceed</strong>. Gmail will send a confirmation link to us.</li>
                                        </ol>
                                        <div className="warning-note" style={{ fontSize: '0.8rem', color: '#ffab00', marginTop: '1rem', display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,171,0,0.05)', borderRadius: '6px' }}>
                                            <Mail size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ lineHeight: '1.4' }}><strong>Important:</strong> Global forwarding is disabled by default in Gmail even after confirming, and we keep it this way. You MUST set up a filter to actually forward your job emails! This means <strong>your personal and non-job related mail will not be forwarded to us.</strong> After you add the address, click the <strong>"I have added the address"</strong> button below to start building your secure filter.</span>
                                        </div>
                                    </div>
                                </div>
                            ) : client === 'outlook' ? (
                                <div className="outlook-setup-guide">
                                    <div className="setup-part" style={{ marginBottom: '2rem' }}>
                                        <div className="safe-forwarding-notice" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--info-color)', marginBottom: '4px', fontSize: '0.9rem' }}>
                                                <ShieldCheck size={16} /> Privacy First: Stay in Control
                                            </p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                                Don't want to forward all your emails? <strong>You don't have to!</strong> Instead of setting up global forwarding, you can use <strong>Outlook Rules</strong> to only forward emails that match job-related keywords (like "Job offer", "Interview", etc.) to your TrackyJobby alias.
                                            </p>
                                        </div>

                                        <div className="tutorial-visual" style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '16/9' }}>
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

                                        <h4>Microsoft Outlook Setup</h4>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>Follow these steps:</p>
                                        <ol>
                                            <li>At the top window of the new Outlook, select <strong>Settings</strong> <Settings size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.7 }} /> .</li>
                                            <li>Select <strong>Mail</strong> &gt; <strong>Forwarding</strong>.</li>
                                            <li>
                                                Toggle the <strong>Enable forwarding</strong> switch, enter the forwarding email address:
                                                <div className="copy-code-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '8px', marginTop: '4px' }}>
                                                    <code className="highlight-code" style={{ margin: 0 }}>{alias}@trackyjobby.com</code>
                                                    <button
                                                        className="copy-icon-btn"
                                                        onClick={() => handleCopy(`${alias}@trackyjobby.com`)}
                                                        title="Copy to clipboard"
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
                                                    >
                                                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </li>
                                            <li>Select <strong>Keep a copy of forwarded messages</strong> and select <strong>Save</strong>.</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : client === 'apple mail' ? (
                                <div className="apple-setup-guide">
                                    <div className="setup-part" style={{ marginBottom: '2rem' }}>
                                        <h4>Apple Mail / iCloud Setup</h4>
                                        <ol>
                                            <li>Go to icloud.com/mail, then sign in to your Apple Account (if necessary).</li>
                                            <li>Select the <strong>Settings</strong> button at the top of the Mailboxes list, then choose <strong>Settings</strong>.</li>
                                            <li>Select <strong>Mail Forwarding</strong> in the sidebar.</li>
                                            <li>
                                                Select the “Forward my email to” checkbox, then type the forwarding address in the text field:
                                                <div className="copy-code-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '8px', marginTop: '4px' }}>
                                                    <code className="highlight-code" style={{ margin: 0 }}>{alias}@trackyjobby.com</code>
                                                    <button
                                                        className="copy-icon-btn"
                                                        onClick={() => handleCopy(`${alias}@trackyjobby.com`)}
                                                        title="Copy to clipboard"
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
                                                    >
                                                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <div className="other-setup-guide">
                                    <div className="setup-part" style={{ marginBottom: '2rem' }}>
                                        <h4>Generic Email Setup</h4>
                                        <div className="safe-forwarding-notice" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', marginTop: '1rem' }}>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--info-color)', marginBottom: '4px', fontSize: '0.9rem' }}>
                                                <ShieldCheck size={16} /> Privacy First: Use Filters
                                            </p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                                To protect your privacy, we recommend setting up an <strong>Email Filter or Rule</strong> in your provider's settings. Tell your provider to only forward emails that contain job-related keywords (like "Offer", "Interview", "Application") instead of forwarding your entire inbox.
                                            </p>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>Follow these general steps for your provider:</p>
                                        <ol>
                                            <li>Log in to your email provider.</li>
                                            <li>Go to your account <strong>Settings</strong> or <strong>Preferences</strong>.</li>
                                            <li>Look for a <strong>Forwarding</strong> or <strong>Filters</strong> section.</li>
                                            <li>
                                                Add your TrackyJobby alias as a forwarding address:
                                                <div className="copy-code-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '8px', marginTop: '4px' }}>
                                                    <code className="highlight-code" style={{ margin: 0 }}>{alias}@trackyjobby.com</code>
                                                    <button
                                                        className="copy-icon-btn"
                                                        onClick={() => handleCopy(`${alias}@trackyjobby.com`)}
                                                        title="Copy to clipboard"
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
                                                    >
                                                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </li>
                                            <li>Save your changes and confirm if required.</li>
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>

                        {client === 'gmail' ? (
                            <button
                                className="primary-btn continue-btn"
                                onClick={handleWaitForVerification}
                                disabled={isSimulating}
                            >
                                {isSimulating ? (
                                    <><RefreshCcw size={16} className="spin" /> Waiting for Gmail email...</>
                                ) : 'I have added the address'}
                            </button>
                        ) : client === 'outlook' || client === 'apple mail' ? (
                            <button className="primary-btn continue-btn" onClick={() => setStep('test')}>I have set up forwarding</button>
                        ) : (
                            <button className="primary-btn continue-btn" onClick={() => setStep('test')}>Next Step</button>
                        )}
                        <button className="back-btn" onClick={() => setStep('client')} disabled={isSimulating}>Back</button>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="step-content animate-fade-in text-center">
                        <div className="icon-wrapper success-icon"><CheckCircle size={32} /></div>
                        <h2>Verification Email Received!</h2>
                        <p className="subtitle">We just received the forwarding confirmation email from Gmail.</p>

                        <div className="instructions-box" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                                1. Finalize Forwarding (Required)
                            </p>
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                Click the link below to confirm the forwarding address in Gmail:
                            </p>
                            <a
                                href={mockVerifyLink || '#'}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'block',
                                    padding: '12px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--info-color)',
                                    wordBreak: 'break-all',
                                    color: 'var(--info-color)',
                                    fontSize: '0.875rem',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    marginBottom: '1.5rem'
                                }}
                            >
                                Confirm Verification Link
                            </a>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                                <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    2. Create Job Filter (Required)
                                </p>
                                <div className="warning-note" style={{ fontSize: '0.8rem', color: '#ffab00', marginBottom: '1rem', display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,171,0,0.05)', borderRadius: '6px' }}>
                                    <MailWarning size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span><strong>Important:</strong> Global forwarding is disabled by default in Gmail even after confirming. You MUST set up a filter to actually forward your emails!</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: 0 }}>
                                        Select the kinds of emails you want to forward to TrackyJobby:
                                    </p>
                                    <select 
                                        value={filterLanguage} 
                                        onChange={(e) => setFilterLanguage(e.target.value as LanguageCode)}
                                        style={{ 
                                            background: 'rgba(255,255,255,0.05)', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            color: 'var(--text-primary)', 
                                            padding: '4px 8px', 
                                            borderRadius: '4px',
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    {selectedCategories.map((cat) => {
                                        const filters = PREDEFINED_FILTERS[filterLanguage][cat as CategoryId] || [];
                                        return filters.map(f => (
                                            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={checkedFilters.includes(f.id)} 
                                                    onChange={(e) => {
                                                        if (e.target.checked) setCheckedFilters([...checkedFilters, f.id]);
                                                        else setCheckedFilters(checkedFilters.filter(id => id !== f.id));
                                                    }} 
                                                    style={{ accentColor: 'var(--primary-color)' }}
                                                />
                                                <span style={{ color: 'var(--text-primary)' }}>{f.label}</span>
                                            </label>
                                        ));
                                    })}
                                </div>

                                <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        <strong>Tip:</strong> You can also add email addresses or domains of platforms you usually get your applications from (like `no-reply@greenhouse.io`, `info@zillow.com`, etc).
                                    </p>
                                    <input
                                        type="text"
                                        value={customKeywords}
                                        onChange={(e) => setCustomKeywords(e.target.value)}
                                        placeholder="Add custom keywords, emails, or websites (comma separated)"
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

                                <ol style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: '1.6', textAlign: 'left' }}>
                                    <li>In Gmail, click the <strong>Filter icon</strong> in the search bar.</li>
                                    <li>
                                        Paste this in <strong>"Has the words"</strong>:
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                                            <code style={{ fontSize: '0.75rem', color: 'var(--primary-color)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {getFilterString()}
                                            </code>
                                            <button
                                                className="copy-icon-btn"
                                                onClick={() => handleCopy(getFilterString())}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                                            >
                                                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </li>
                                    <li>Click <strong>Create filter</strong>.</li>
                                    <li>Check <strong>Forward it to</strong> and select your alias.</li>
                                    <li>Click <strong>Create filter</strong>.</li>
                                </ol>
                            </div>
                        </div>

                        <button
                            className="primary-btn continue-btn"
                            onClick={() => setStep('test')}
                        >
                            I've finished setup
                        </button>

                        <button className="back-btn mt-2" onClick={() => setStep('instructions')}>Back to Instructions</button>
                    </div>
                )}

                {step === 'test' && (
                    <div className="step-content animate-fade-in text-center">
                        <div className="icon-wrapper"><Send size={32} /></div>
                        <h2>Test your connection</h2>
                        <p className="subtitle">Go back to your email client and forward a recent job application email to <strong>{alias}@trackyjobby.com</strong> to test the system.</p>

                        <button
                            className="primary-btn continue-btn mt-4"
                            onClick={handleTestForward}
                            disabled={isSimulating}
                        >
                            {isSimulating ? (
                                <><RefreshCcw size={16} className="spin" /> Listening for email...</>
                            ) : "I've forwarded an email"}
                        </button>
                        <button className="back-btn mt-2" onClick={() => navigate('/dashboard')} disabled={isSimulating}>
                            Skip for now
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
