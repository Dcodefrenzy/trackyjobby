import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.tsx';
import { getInterviews, deleteInterview, type JobInterview } from '../api/client';
import { CATEGORIES, type CategoryId } from '../config/categories';
import { Trash2 } from 'lucide-react';
import './AppLayout.css';

export default function AppLayout() {
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const [activeCategory, setActiveCategory] = useState<CategoryId>(
        (localStorage.getItem('trackyjobby_category') as CategoryId) || 'job'
    );

    useEffect(() => {
        // Only fetch if we are on dashboard or related pages
        if (location.pathname.startsWith('/dashboard') || location.pathname === '/') {
            getInterviews(activeCategory).then(res => {
                setInterviews(res.interviews || []);
            }).catch(err => {
                console.error("Failed to fetch interviews:", err);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [location.pathname, activeCategory]);

    const handleDeleteInterview = async (id: string) => {
        if (!window.confirm('Delete this interview?')) return;
        try {
            await deleteInterview(id);
            setInterviews(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error("Failed to delete interview:", err);
        }
    };

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
                    <Outlet context={{ activeCategory, setActiveCategory }} />
                </main>

                <aside className="right-sidebar">
                    <div className="sidebar-sticky">
                        <div className="interviews-widget">
                            <div className="widget-header">
                                <h3>Upcoming {CATEGORIES[activeCategory].interviewLabel}s</h3>
                                {interviews.length > 0 && (
                                    <span className="badge badge-primary">{interviews.length} soon</span>
                                )}
                            </div>

                            <div className="interview-items">
                                {loading ? (
                                    <div className="text-muted text-sm" style={{ padding: '1rem' }}>Loading...</div>
                                ) : interviews.length === 0 ? (
                                    <div className="text-muted text-sm" style={{ padding: '1rem' }}>No upcoming {CATEGORIES[activeCategory].interviewLabel.toLowerCase()}s scheduled</div>
                                ) : (
                                    interviews.map(inv => (
                                        <div key={inv.id} className="interview-item" style={{ position: 'relative' }}>
                                            <div className="interview-date" style={{ flexShrink: 0 }}>
                                                <span className="month">{formatMonth(inv.date)}</span>
                                                <span className="day">{formatDay(inv.date)}</span>
                                            </div>
                                            <div className="interview-info" style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
                                                <h4 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.companyName}</h4>
                                                <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.type}</p>
                                                <span className="time-tag">{formatTime(inv.date)}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteInterview(inv.id)}
                                                style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={13} style={{ opacity: 0.6 }} />
                                            </button>
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
