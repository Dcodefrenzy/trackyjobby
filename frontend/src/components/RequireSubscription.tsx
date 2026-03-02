import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireSubscriptionProps {
    children: React.ReactNode;
}

const RequireSubscription: React.FC<RequireSubscriptionProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#e1e4e8' }}>
                Loading subscription status...
            </div>
        );
    }

    const isSubscribed = user?.subscription_status && ['trialing', 'active', 'past_due', 'lifetime', 'canceled'].includes(user.subscription_status);
    const isPaymentSuccess = new URLSearchParams(location.search).get('payment') === 'success';

    if (!isSubscribed) {
        if (isPaymentSuccess) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#e1e4e8' }}>
                    <div style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Finalizing your subscription...</div>
                    <div className="animate-pulse" style={{ color: '#8b949e' }}>Communicating with Stripe, please wait a moment.</div>
                </div>
            );
        }
        // Redirect to plan selection, saving the attempted URL
        return <Navigate to="/plan-selection" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default RequireSubscription;
