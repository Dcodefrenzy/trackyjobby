import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────
export const register = (email: string, password: string, name?: string) =>
    api.post('/api/auth/register', { email, password, name }).then((r) => r.data);

export const login = (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }).then((r) => r.data);

export const verifyEmail = (token: string) =>
    api.get(`/api/auth/verify/${token}`).then((r) => r.data);

export const setupForwarder = (mailForwarder: string) =>
    api.post('/api/auth/setup-forwarder', { mailForwarder }).then((r) => r.data);

export const getMe = () => api.get('/api/auth/me').then((r) => r.data);

export const getForwardingVerification = (): Promise<{ verificationUrl: string }> =>
    api.get('/api/auth/forwarding-verification').then((r) => r.data);

// ─── Jobs ─────────────────────────────────────────────────────────────
export interface JobEvent {
    id: string;
    type: string;
    description: string;
    oldStatus: string | null;
    newStatus: string;
    createdAt: string;
}

export interface JobApplication {
    id: string;
    jobTitle: string;
    company: string;
    domain: string;
    logo: string | null;
    status: 'Applied' | 'Interview' | 'Offer' | 'Accepted' | 'Rejected';
    salary: string | null;
    location: string;
    appliedDate: string;
    updated: string;
    events: JobEvent[];
}

export const getJobs = (): Promise<{ jobs: JobApplication[] }> =>
    api.get('/api/jobs').then((r) => r.data);

export interface JobInterview {
    id: string;
    type: string;
    date: string;
    link: string | null;
    status: string;
    jobTitle: string;
    companyName: string;
}

export const getInterviews = (): Promise<{ interviews: JobInterview[] }> =>
    api.get('/api/jobs/interviews').then((r) => r.data);

export const submitFeedback = (category: string, message: string) =>
    api.post('/api/feedback', { category, message }).then((r) => r.data);

export const createPortalSession = (): Promise<{ url: string }> =>
    api.post('/api/payment/create-portal-session').then((r) => r.data);

export default api;
