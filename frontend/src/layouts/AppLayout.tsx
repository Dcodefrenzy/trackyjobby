import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.tsx';
import { getInterviews, type JobInterview } from '../api/client';
import './AppLayout.css';

export default function AppLayout() {
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Only fetch if we are on dashboard or related pages
        if (location.pathname.startsWith('/dashboard') || location.pathname === '/') {
            getInterviews().then(res => {
                setInterviews(res.interviews || []);
            }).catch(err => {
                console.error("Failed to fetch interviews:", err);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [location.pathname]);

    const formatMonth = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
    };

    const formatDay = (dateStr: string) => {
        return new Date(dateStr).getDate();
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="layout-container animate-fade-in">
            <Navbar />
            <div className="dashboard-content-wrapper">
                <main className="main-content">
                    <Outlet />
                </main>

                <aside className="right-sidebar">
                    <div className="sidebar-sticky">
                        <div className="interviews-widget">
                            <div className="widget-header">
                                <h3>Upcoming Interviews</h3>
                                {interviews.length > 0 && (
                                    <span className="badge badge-primary">{interviews.length} soon</span>
                                )}
                            </div>

                            <div className="interview-items">
                                {loading ? (
                                    <div className="text-muted text-sm" style={{ padding: '1rem' }}>Loading interviews...</div>
                                ) : interviews.length === 0 ? (
                                    <div className="text-muted text-sm" style={{ padding: '1rem' }}>No upcoming interviews scheduled</div>
                                ) : (
                                    interviews.map(inv => (
                                        <div key={inv.id} className="interview-item">
                                            <div className="interview-date">
                                                <span className="month">{formatMonth(inv.date)}</span>
                                                <span className="day">{formatDay(inv.date)}</span>
                                            </div>
                                            <div className="interview-info">
                                                <h4>{inv.companyName}</h4>
                                                <p>{inv.type}</p>
                                                <span className="time-tag">{formatTime(inv.date)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
