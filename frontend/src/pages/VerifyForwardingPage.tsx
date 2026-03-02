import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import './EmailClientSetupPage.css';

export default function VerifyForwardingPage() {
    const [searchParams] = useSearchParams();
    const alias = searchParams.get('alias');
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVerifying(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="setup-container animate-fade-in">
            <div className="setup-card text-center">
                {verifying ? (
                    <>
                        <div className="flex-center" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            <div className="loader spin" style={{ width: '48px', height: '48px', border: '3px solid', borderRadius: '50%', borderTopColor: 'var(--primary-color)' }}></div>
                        </div>
                        <h2>Verifying...</h2>
                        <p className="subtitle">Authorizing Google to forward emails to {alias}@trackyjobby.com</p>
                    </>
                ) : (
                    <>
                        <div className="icon-wrapper success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h2>Success!</h2>
                        <p className="subtitle" style={{ lineHeight: '1.6' }}>
                            You have successfully confirmed the forwarding address for <strong>{alias}@trackyjobby.com</strong>.
                            <br /><br />
                            You can safely close this window and return to your TrackyJobby setup tab to finish testing your connection.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
