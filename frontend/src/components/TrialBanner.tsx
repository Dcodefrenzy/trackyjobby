import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle } from 'lucide-react';

const TrialBanner: React.FC = () => {
    const { user } = useAuth();

    if (!user?.subscription_status || !['trialing', 'canceled'].includes(user.subscription_status)) {
        return null;
    }

    const isCanceled = user.subscription_status === 'canceled';

    // Since we don't have trial_end_date in the User object yet, 
    // we use a generic message for now, or we can add it later.
    return (
        <div style={{
            background: isCanceled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 171, 0, 0.1)',
            border: `1px solid ${isCanceled ? '#ef4444' : '#ffab00'}`,
            color: isCanceled ? '#f87171' : '#ffab00',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 500
        }}>
            <AlertCircle size={18} />
            <span style={{ flex: 1 }}>
                {isCanceled
                    ? "Your subscription has been canceled. You will lose access to your tracking data soon unless you resubscribe."
                    : "You are currently on a 3-day free trial. Your card will be charged after the trial ends unless you cancel."}
            </span>
            <a
                href={isCanceled ? "/plan-selection" : "/profile"}
                style={{
                    color: isCanceled ? '#f87171' : '#ffab00',
                    textDecoration: 'underline',
                    whiteSpace: 'nowrap',
                    fontWeight: 600
                }}
            >
                {isCanceled ? "Resubscribe" : "Manage Subscription"}
            </a>
        </div>
    );
};

export default TrialBanner;
