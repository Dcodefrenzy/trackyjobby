import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, RefreshCcw, Send, Copy, Check } from 'lucide-react';
import { setupForwarder, getMe, getForwardingVerification } from '../api/client';
import './EmailClientSetupPage.css';

type SetupStep = 'alias' | 'client' | 'instructions' | 'verify' | 'test';

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

    useEffect(() => {
        getMe()
            .then(data => {
                if (data.mail_forwarder) {
                    setAlias(data.mail_forwarder);
                    setStep('client');
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
            setStep('client');
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to save alias. Try another one.');
        } finally {
            setIsSimulating(false);
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
                                        <h4>PART 1 — Enable Forwarding</h4>
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
                                        <div className="warning-note" style={{ fontSize: '0.8rem', color: '#ffab00', marginTop: '0.5rem', display: 'flex', gap: '8px' }}>
                                            <CheckCircle size={14} style={{ flexShrink: 0 }} />
                                            <span>After verifying, do <strong>NOT</strong> chose "Forward a copy of all incoming mail". We will use a filter instead.</span>
                                        </div>
                                    </div>

                                    <div className="setup-part" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <h4>PART 2 — Create the Job Filter</h4>
                                        <ol>
                                            <li>In Gmail, click the <strong>search bar</strong>.</li>
                                            <li>Click the <strong>Filter icon</strong> (right side of search bar).</li>
                                            <li>
                                                Paste this in the <strong>"Has the words"</strong> field:
                                                <div className="copy-code-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '4px' }}>
                                                    <code style={{ fontSize: '0.75rem', color: 'var(--primary-color)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        (subject:job OR subject:career OR subject:position OR subject:interview OR subject:offer OR recruiter OR hiring OR "job application" OR "career opportunity")
                                                    </code>
                                                    <button
                                                        className="copy-icon-btn"
                                                        onClick={() => handleCopy('(subject:job OR subject:career OR subject:position OR subject:interview OR subject:offer OR recruiter OR hiring OR "job application" OR "career opportunity")')}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                    >
                                                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </li>
                                            <li>Click <strong>Create filter</strong>.</li>
                                            <li>Check <strong>Forward it to</strong> and select your <code>{alias}@trackyjobby.com</code> address.</li>
                                            <li>(Optional) Check <strong>Never send it to Spam</strong>.</li>
                                            <li>Click <strong>Create filter</strong>.</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <p>
                                    Set up a forwarding rule in your email client to forward all job-related emails to:
                                    <br />
                                    <div className="copy-code-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                        <code className="highlight-code" style={{ margin: 0 }}>{alias}@trackyjobby.com</code>
                                        <button
                                            className="copy-icon-btn"
                                            onClick={() => handleCopy(`${alias}@trackyjobby.com`)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </p>
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
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                Click the link below to confirm the forwarding in Gmail:
                            </p>
                            <a
                                href={mockVerifyLink || '#'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => {
                                    // Give them a moment to actually click/confirm before moving on
                                    setTimeout(() => {
                                        setStep('test');
                                    }, 2000);
                                }}
                                style={{
                                    wordBreak: 'break-all',
                                    color: 'var(--info-color)',
                                    fontSize: '0.875rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                {mockVerifyLink}
                            </a>
                        </div>

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
