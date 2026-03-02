import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getMe } from '../api/client';
import type { User } from '../types.ts';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        // Check if we just came back from a successful payment
        const params = new URLSearchParams(window.location.search);
        const isPaymentSuccess = params.get('payment') === 'success';

        const fetchUser = async (retryCount = 0) => {
            try {
                const u = await getMe();
                // If we are expecting a subscription update, retry a few times if it's still 'none'
                if (isPaymentSuccess && (!u.subscription_status || u.subscription_status === 'none') && retryCount < 3) {
                    console.log(`⏳ [AUTH] Payment success detected but status is still 'none'. Retrying in 2s... (${retryCount + 1}/3)`);
                    setTimeout(() => fetchUser(retryCount + 1), 2000);
                    return;
                }
                setUser(u);
            } catch (err) {
                console.error("Auth fetch failed:", err);
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = async (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        const u = await getMe();
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const refreshUser = async () => {
        const u = await getMe();
        console.log("👤 [AUTH] Refreshed User Status:", u.subscription_status);
        setUser(u);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
