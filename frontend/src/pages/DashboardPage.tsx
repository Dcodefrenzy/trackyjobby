import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Calendar, Trash2, Check, ChevronDown, Loader2, X, Clock, MailWarning, Edit2, Home, GraduationCap, Award, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getJobs, deleteJob, updateJob, type JobApplication } from '../api/client';
import { CATEGORIES, type CategoryId } from '../config/categories';
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
    
    // Get activeCategory from AppLayout context
    const { activeCategory, setActiveCategory } = useOutletContext<{ activeCategory: CategoryId, setActiveCategory: (c: CategoryId) => void }>();
    
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
    const [editForm, setEditForm] = useState({ title: '', status: '', salary: '', location: '', notes: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleEditClick = (app: JobApplication, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingJob(app);
        setEditForm({
            title: app.jobTitle,
            status: app.status,
            salary: app.salary || '',
            location: app.location || 'Unknown',
            notes: app.notes || ''
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this application? This cannot be undone.')) return;
        
        try {
            await deleteJob(id);
            setJobs(prev => prev ? prev.filter(j => j.id !== id) : null);
        } catch (err) {
            console.error('Failed to delete job', err);
            alert('Failed to delete application. Please try again.');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingJob) return;
        
        setIsSaving(true);
        try {
            await updateJob(editingJob.id, {
                jobTitle: editForm.title,
                status: editForm.status,
                salary: editForm.salary,
                location: editForm.location,
                notes: editForm.notes
            });
            
            setJobs(prev => prev ? prev.map(j => j.id === editingJob.id ? {
                ...j,
                jobTitle: editForm.title,
                status: editForm.status as any,
                salary: editForm.salary,
                location: editForm.location,
                notes: editForm.notes,
                updated: new Date().toISOString()
            } : j) : null);
            
            setIsEditModalOpen(false);
            setEditingJob(null);
        } catch (err) {
            console.error('Failed to update job', err);
            alert('Failed to update application. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

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
        localStorage.setItem('trackyjobby_category', activeCategory);
        setLoading(true);
        getJobs(activeCategory)
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
    }, [activeCategory]);

    // Derived State Check
    const filteredJobs = jobs?.filter(j =>
        statusFilter === 'All status' || j.status === statusFilter
    ) || [];

    const bookmarkedApps = filteredJobs.filter(j => j.status === 'Bookmarked');
    const activeApps = filteredJobs.filter(j => ['Applied', 'Interview', 'Offer'].includes(j.status));
    const acceptedApps = filteredJobs.filter(j => j.status === 'Accepted');
    const closedApps = filteredJobs.filter(j => j.status === 'Rejected');
    const totalCount = jobs?.length || 0;
    const interviewsCount = jobs?.filter(j => j.status === 'Interview').length || 0;

    const renderJobCard = (app: JobApplication) => (
        <div key={app.id} className="job-card clickable" onClick={() => { setSelectedJob(app); setIsModalOpen(true); }}>
            <div className="job-card-header flex-between" style={{ alignItems: 'flex-start', gap: '1rem' }}>
                <div className="flex-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                    <div className="company-logo" style={{ flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                            color: app.company === 'Processing...' ? 'var(--accent-color)' : 'var(--text-secondary)', 
                            fontSize: '0.8125rem', 
                            fontWeight: 400, 
                            marginBottom: '0.125rem', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {app.company}
                            {app.company === 'Processing...' && (
                                <span className="pulse-dot" style={{ 
                                    width: '6px', 
                                    height: '6px', 
                                    borderRadius: '50%', 
                                    backgroundColor: 'var(--accent-color)',
                                    display: 'inline-block'
                                }}></span>
                            )}
                        </h4>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.jobTitle}</h3>
                    </div>
                </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {app.sourceUrl && (
                                <a 
                                    href={app.sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="icon-action-btn"
                                    onClick={e => e.stopPropagation()}
                                    title="Visit Original Link"
                                    style={{ color: 'var(--primary-color)' }}
                                >
                                    <ExternalLink size={14} />
                                </a>
                            )}
                            <span className={`status-badge ${app.status === 'Interview' ? 'status-interview' : app.status === 'Bookmarked' ? 'status-applied' : 'status-applied'}`}>
                                <Calendar size={12} />
                                {app.status}
                            </span>
                        </div>
                        <div className="job-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-action-btn" onClick={(e) => handleEditClick(app, e)} title="Edit"><Edit2 size={14} /></button>
                        <button className="icon-action-btn delete" onClick={(e) => handleDeleteClick(app.id, e)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                </div>
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
    );
    return (
        <div className="dashboard-container animate-fade-in">
            <TrialBanner />

            {/* Missing Alias Setup Banner */}
            {!user?.mail_forwarder && (
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
            <header className="dashboard-header" style={{ marginBottom: '1.5rem', borderBottom: 'none', paddingBottom: '0' }}>
                <div>
                    <h1>{CATEGORIES[activeCategory].label}</h1>
                    <p>Track and manage your {CATEGORIES[activeCategory].label.toLowerCase()}</p>
                </div>
            </header>

            {/* Category Tab Bar */}
            <div className="category-tabs no-scrollbar" style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {(Object.entries(CATEGORIES) as [CategoryId, typeof CATEGORIES[keyof typeof CATEGORIES]][])
                    .filter(([id]) => (user?.enabledCategories || ['job']).includes(id))
                    .map(([id, cat]) => {
                    const Icon = id === 'job' ? Briefcase : id === 'housing' ? Home : id === 'school' ? GraduationCap : Award;
                    const isActive = activeCategory === id;
                    return (
                        <button
                            key={id}
                            onClick={() => { setActiveCategory(id); setStatusFilter('All status'); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: isActive ? 500 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Icon size={18} />
                            {cat.label}
                        </button>
                    )
                })}
            </div>

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
                            {CATEGORIES[activeCategory].statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                </section>

                {/* Bookmarked Apps */}
                {(statusFilter === 'All status' || statusFilter === 'Bookmarked') && bookmarkedApps.length > 0 && (
                    <section className="app-section">
                        <div className="section-header flex-between">
                            <div>
                                <h3>Bookmarked / Saved</h3>
                                <p>Saved listings you haven't applied to yet</p>
                            </div>
                            <span className="badge badge-muted">{bookmarkedApps.length} saved</span>
                        </div>

                        <div className="apps-grid scrollable-grid animate-fade-in">
                            {bookmarkedApps.map(renderJobCard)}
                        </div>
                    </section>
                )}

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
                            <div className="apps-grid scrollable-grid animate-fade-in">
                                {activeApps.map(renderJobCard)}
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
                            <div className="apps-grid scrollable-grid animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                                {closedApps.map(app => (
                                    <div key={app.id} className="job-card clickable shadow-sm" style={{ opacity: 0.8 }} onClick={() => { setSelectedJob(app); setIsModalOpen(true); }}>
                                        <div className="job-card-header flex-between" style={{ alignItems: 'flex-start', gap: '1rem' }}>
                                            <div className="flex-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                                                <div className="company-logo" style={{ flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                                                    <img
                                                        src={app.logo || (app.domain ? `https://cdn.brandfetch.io/${app.domain}?c=1idpPzZ5e4dgNRWVKYA` : '')}
                                                        alt={`${app.company} Logo`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 400, marginBottom: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.company}</h4>
                                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.jobTitle}</h3>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                                                <span className="status-badge status-rejected">
                                                    <Trash2 size={12} />
                                                    {app.status}
                                                </span>
                                                <div className="job-card-actions" onClick={e => e.stopPropagation()}>
                                                    <button className="icon-action-btn" onClick={(e) => handleEditClick(app, e)} title="Edit"><Edit2 size={14} /></button>
                                                    <button className="icon-action-btn delete" onClick={(e) => handleDeleteClick(app.id, e)} title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <p className="modal-company-name">{selectedJob.company}</p>
                                        {selectedJob.sourceUrl && (
                                            <a 
                                                href={selectedJob.sourceUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-primary hover-underline flex-center gap-1"
                                                style={{ fontSize: '0.8125rem', color: 'var(--primary-color)' }}
                                            >
                                                Visit Listing <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
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

                            {selectedJob.notes && (
                                <div className="modal-notes" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Job Description / Notes</h3>
                                    <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{selectedJob.notes}</p>
                                </div>
                            )}

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
                            <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Job Modal */}
            {isEditModalOpen && editingJob && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="modal-content edit-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                            <X size={20} />
                        </button>
                        <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Edit Application</h2>
                        </div>
                        <form onSubmit={handleSaveEdit} className="edit-job-form">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{CATEGORIES[activeCategory].fields.title}</label>
                                <input 
                                    className="fancy-input"
                                    type="text" 
                                    value={editForm.title} 
                                    onChange={e => setEditForm({...editForm, title: e.target.value})} 
                                    required 
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</label>
                                <select 
                                    className="fancy-input"
                                    value={editForm.status} 
                                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: '#fff' }}
                                >
                                    {CATEGORIES[activeCategory].statuses.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Salary Range</label>
                                    <input 
                                        className="fancy-input"
                                        type="text" 
                                        value={editForm.salary} 
                                        onChange={e => setEditForm({...editForm, salary: e.target.value})} 
                                        placeholder="e.g. $100k - $120k"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: '#fff' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Location / Type</label>
                                    <select 
                                        className="fancy-input"
                                        value={editForm.location} 
                                        onChange={e => setEditForm({...editForm, location: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: '#fff' }}
                                    >
                                        <option value="Remote">Remote</option>
                                        <option value="On-site">On-site</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Unknown">Unknown</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Job Description / Notes</label>
                                <textarea 
                                    className="fancy-input"
                                    value={editForm.notes || ''} 
                                    onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                                    placeholder="Paste job description or add notes here..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: '#fff', minHeight: '120px', resize: 'vertical' }}
                                />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="secondary-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
