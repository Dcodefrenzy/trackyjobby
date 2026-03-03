import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Calendar, Trash2, Check, ChevronDown, Loader2, X, Clock, MailWarning } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getJobs, type JobApplication } from '../api/client';
import TrialBanner from '../components/TrialBanner';
import './DashboardPage.css';

export default function DashboardPage() {
    const { user, refreshUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<JobApplication[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All status');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('portal') === 'return') {
            const refreshWithRetry = async (count = 0) => {
                await refreshUser();
                if (count < 2) setTimeout(() => refreshWithRetry(count + 1), 2000);
            };
            refreshWithRetry();
            navigate('/dashboard', { replace: true });
        }
    }, [location.search, refreshUser, navigate]);

    useEffect(() => {
        getJobs()
            .then((res) => {
                setJobs(res.jobs || []);
            })
            .catch((err) => {
                console.error("Failed to load jobs:", err);
                setJobs([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Derived State Check
    const filteredJobs = jobs?.filter(j =>
        statusFilter === 'All status' || j.status === statusFilter
    ) || [];

    const activeApps = filteredJobs.filter(j => ['Applied', 'Interview', 'Offer'].includes(j.status));
    const acceptedApps = filteredJobs.filter(j => j.status === 'Accepted');
    const closedApps = filteredJobs.filter(j => j.status === 'Rejected');
    const totalCount = jobs?.length || 0;
    const interviewsCount = jobs?.filter(j => j.status === 'Interview').length || 0;
    return (
        <div className="dashboard-container animate-fade-in">
            <TrialBanner />

            {/* Missing Alias Setup Banner */}
            {!user?.mailForwarder && (
                <div className="setup-alert" style={{
                    background: 'rgba(255, 171, 0, 0.1)',
                    border: '1px solid #ffab00',
                    color: '#ffab00',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MailWarning size={20} style={{ flexShrink: 0 }} />
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>Email Forwarding Not Configured</strong>
                            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>You won't receive job application updates until you set up your forwarding alias.</span>
                        </div>
                    </div>
                    <button
                        className="primary-btn"
                        onClick={() => navigate('/setup/email-client')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                        Complete Setup
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="dashboard-header flex-between">
                <div>
                    <h1>Job Applications</h1>
                    <p>Track and manage your job applications for this season</p>
                </div>
            </header>

            {/* Metrics Section */}
            <section className="metrics-grid">
                <div className="metric-card">
                    <h4>Total Applications</h4>
                    <div className="metric-value">
                        <h2>{totalCount || '-'}</h2>
                        {jobs && <span className="text-success">+ {totalCount} tracked</span>}
                    </div>
                </div>
                <div className="metric-card">
                    <h4>Active Applications</h4>
                    <div className="metric-value">
                        <h2>{activeApps.length}</h2>
                        {activeApps.length > 0 && <span className="text-muted">pending response</span>}
                    </div>
                </div>
                <div className="metric-card">
                    <h4>Interviews</h4>
                    <div className="metric-value">
                        <h2>{interviewsCount}</h2>
                    </div>
                </div>
                <div className="metric-card">
                    <h4>Offers</h4>
                    <div className="metric-value">
                        <h2>{acceptedApps.length}</h2>
                        {acceptedApps.length > 0 && <span className="text-success">congratulations!</span>}
                    </div>
                </div>
            </section>

            {/* Sections Wrapper */}
            <div className="application-sections">

                {/* Filter Section */}
                <section className="filter-section flex-between">
                    <div>
                        <h3>Filter Applications</h3>
                        <p>View applications by status</p>
                    </div>
                    <div className="filter-dropdown-wrapper">
                        <select
                            className="filter-dropdown-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All status">All status</option>
                            <option value="Applied">Applied</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                </section>

                {/* Active Apps */}
                {(statusFilter === 'All status' || statusFilter === 'Applied' || statusFilter === 'Interview' || statusFilter === 'Offer') && (
                    <section className="app-section">
                        <div className="section-header flex-between">
                            <div>
                                <h3>{statusFilter === 'Interview' ? 'Interview Stage' : statusFilter === 'Offer' ? 'Received Offers' : 'Active Applications'}</h3>
                                <p>{statusFilter === 'Interview' ? 'Applications currently in interview rounds' : statusFilter === 'Offer' ? 'Congratulations! Pending offers' : 'Applications currently in progress'}</p>
                            </div>
                            <span className="badge badge-primary">{activeApps.length} {statusFilter === 'Interview' ? 'interviews' : statusFilter === 'Offer' ? 'offers' : 'active'}</span>
                        </div>

                        {loading ? (
                            <div className="flex-center" style={{ padding: '4rem' }}>
                                <Loader2 size={32} className="text-muted" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : activeApps.length === 0 ? (
                            <div className="empty-state">
                                <Briefcase size={32} className="text-muted" />
                                <h4>No active applications</h4>
                                <p className="text-muted text-sm">Forward job applications to your TrackyJobby email address and they will magically appear here.</p>
                            </div>
                        ) : (
                            <div className="apps-grid animate-fade-in">
                                {activeApps.map(app => (
                                    <div key={app.id} className="job-card clickable" onClick={() => { setSelectedJob(app); setIsModalOpen(true); }}>
                                        <div className="job-card-header flex-between">
                                            <div className="flex-center gap-3">
                                                <div className="company-logo" style={{ overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                                                    <img
                                                        src={app.logo || (app.domain ? `https://cdn.brandfetch.io/${app.domain}?c=1idpPzZ5e4dgNRWVKYA` : '')}
                                                        alt={`${app.company} Logo`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            if (target.parentElement) {
                                                                target.parentElement.innerHTML = app.company.charAt(0).toUpperCase();
                                                                target.parentElement.style.backgroundColor = 'var(--bg-color)';
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 400, marginBottom: '0.125rem' }}>{app.company}</h4>
                                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{app.jobTitle}</h3>
                                                </div>
                                            </div>
                                            <span className={`status-badge ${app.status === 'Interview' ? 'status-interview' : 'status-applied'}`}>
                                                <Calendar size={12} />
                                                {app.status}
                                            </span>
                                        </div>

                                        <div className="job-details-grid">
                                            <div className="detail-item">
                                                <MapPin size={14} />
                                                <span>{app.location || 'Unknown'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <DollarSign size={14} />
                                                <span>{app.salary || 'Unknown'}</span>
                                            </div>
                                            <div className="detail-item text-muted">
                                                <span>Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="job-card-footer">
                                            <span className="text-muted">Updated {new Date(app.updated).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Accepted Offers */}
                {(statusFilter === 'All status' || statusFilter === 'Accepted') && (
                    <section className="app-section">
                        <div className="section-header flex-between">
                            <div>
                                <h3>Accepted Offers</h3>
                                <p>Applications where you've accepted the offer</p>
                            </div>
                            <span className="badge badge-success">{acceptedApps.length} accepted</span>
                        </div>
                        {acceptedApps.length === 0 ? (
                            <div className="empty-state" style={{ marginBottom: '1rem' }}>
                                <Check size={32} className="text-muted" />
                                <h4>No accepted applications</h4>
                                <p className="text-muted text-sm">Job offers will appear here</p>
                            </div>
                        ) : (
                            <div className="apps-grid animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                                {/* TODO Map Accepted cards here if needed */}
                                <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>You have {acceptedApps.length} offer(s)!</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Closed Apps */}
                {(statusFilter === 'All status' || statusFilter === 'Rejected') && (
                    <section className="app-section" id="closed-applications">
                        <div className="section-header flex-between">
                            <div>
                                <h3>Closed Applications</h3>
                                <p>Completed applications (offers & rejections)</p>
                            </div>
                            <span className="badge badge-muted">{closedApps.length} closed</span>
                        </div>
                        {closedApps.length === 0 ? (
                            <div className="empty-state">
                                <Trash2 size={32} className="text-muted" />
                                <h4>No closed applications</h4>
                                <p className="text-muted text-sm">Rejected applications will appear here</p>
                            </div>
                        ) : (
                            <div className="apps-grid animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                                {closedApps.map(app => (
                                    <div key={app.id} className="job-card clickable shadow-sm" style={{ opacity: 0.8 }} onClick={() => { setSelectedJob(app); setIsModalOpen(true); }}>
                                        <div className="job-card-header flex-between">
                                            <div className="flex-center gap-3">
                                                <div className="company-logo" style={{ overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                                                    <img
                                                        src={app.logo || (app.domain ? `https://cdn.brandfetch.io/${app.domain}?c=1idpPzZ5e4dgNRWVKYA` : '')}
                                                        alt={`${app.company} Logo`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 400, marginBottom: '0.125rem' }}>{app.company}</h4>
                                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{app.jobTitle}</h3>
                                                </div>
                                            </div>
                                            <span className="status-badge status-rejected">
                                                <Trash2 size={12} />
                                                {app.status}
                                            </span>
                                        </div>
                                        <div className="job-card-footer">
                                            <span className="text-muted">Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>

            {/* Job Details Modal */}
            {isModalOpen && selectedJob && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                            <X size={20} />
                        </button>

                        <div className="modal-header">
                            <div className="modal-company-info">
                                <div className="modal-logo">
                                    <img
                                        src={selectedJob.logo || (selectedJob.domain ? `https://cdn.brandfetch.io/${selectedJob.domain}?c=1idpPzZ5e4dgNRWVKYA` : '')}
                                        alt={selectedJob.company}
                                    />
                                </div>
                                <div>
                                    <h2>{selectedJob.jobTitle}</h2>
                                    <p className="modal-company-name">{selectedJob.company}</p>
                                </div>
                            </div>
                            <span className={`status-badge big-badge status-${selectedJob.status.toLowerCase()}`}>
                                {selectedJob.status}
                            </span>
                        </div>

                        <div className="modal-body">
                            <div className="modal-details-grid">
                                <div className="modal-detail-item">
                                    <MapPin size={18} />
                                    <div>
                                        <label>Location</label>
                                        <span>{selectedJob.location || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div className="modal-detail-item">
                                    <DollarSign size={18} />
                                    <div>
                                        <label>Salary Range</label>
                                        <span>{selectedJob.salary || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div className="modal-detail-item">
                                    <Clock size={18} />
                                    <div>
                                        <label>Last Updated</label>
                                        <span>{new Date(selectedJob.updated).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="modal-detail-item">
                                    <Calendar size={18} />
                                    <div>
                                        <label>Date Applied</label>
                                        <span>{new Date(selectedJob.appliedDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-journey">
                                <h3>Application Journey</h3>
                                <div className="journey-timeline">
                                    {selectedJob.events && selectedJob.events.length > 0 ? (
                                        selectedJob.events.map((event, idx) => (
                                            <div key={event.id} className={`journey-step ${event.newStatus === 'Rejected' ? 'rejected' :
                                                ['Offer', 'Accepted'].includes(event.newStatus) ? 'success' :
                                                    idx === selectedJob.events.length - 1 ? 'active' : 'completed'
                                                }`}>
                                                <div className="step-icon"><div className="dot"></div></div>
                                                <div className="step-info">
                                                    <h4>{event.type === 'Interview Scheduled' ? 'Interview Scheduled' :
                                                        event.newStatus === 'Applied' && !event.oldStatus ? 'Application Submitted' :
                                                            event.newStatus === 'Interview' ? 'Interview Stage' :
                                                                event.newStatus === 'Rejected' ? 'Application Rejected' :
                                                                    event.newStatus === 'Offer' ? 'Job Offer Received' :
                                                                        event.newStatus === 'Accepted' ? 'Offer Accepted' : event.newStatus}</h4>
                                                    <p>{new Date(event.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                    {event.description && <p className="text-xs" style={{ marginTop: '0.25rem', opacity: 0.8 }}>{event.description}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="journey-step completed">
                                            <div className="step-icon"><div className="dot"></div></div>
                                            <div className="step-info">
                                                <h4>Application Submitted</h4>
                                                <p>{new Date(selectedJob.appliedDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
