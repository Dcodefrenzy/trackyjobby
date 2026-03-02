import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import './AuthPage.css';

import { useParams } from 'react-router-dom';
import { verifyEmail } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function VerifyPage() {
    const { token } = useParams<{ token: string }>();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('No verification token found in this link.');
            return;
        }

        verifyEmail(token)
            .then(async (data: any) => {
                // Set the logged in context/token
                await login(data.token);

                // Push user to client setup step
                navigate('/setup/email-client');
            })
            .catch((err: any) => {
                setStatus('error');
                setErrorMsg(err?.message || err?.response?.data?.error || 'This verification link is invalid or has expired.');
            });
    }, [navigate, token, login]);

    return (
        <div className="auth-container">
            <div className="auth-card text-center">
                {status === 'verifying' ? (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div className="spinner" style={{
                            width: '40px', height: '40px',
                            border: '2px solid var(--border-color)',
                            borderTopColor: 'var(--text-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <h2 style={{ fontSize: '1.25rem', marginTop: '1rem' }}>Verifying your email...</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Just a moment.</p>
                    </div>
                ) : (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <XCircle size={48} color="var(--danger-color)" strokeWidth={1.5} />
                        <h2 style={{ fontSize: '1.25rem' }}>Verification failed</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
                        <button className="primary-btn" onClick={() => navigate('/auth/register')} style={{ marginTop: '1rem', width: '100%' }}>
                            Back to register
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
        </div>
    );
}
