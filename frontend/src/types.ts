export interface User {
    id: string;
    email: string;
    name: string | null;
    mail_forwarder: string | null;
    forwardingEmail: string | null;
    email_verified: boolean;
    subscription_status: 'none' | 'trialing' | 'active' | 'canceled' | 'lifetime';
    created_at: string;
}

export interface Company {
    id: string;
    name: string;
    domain: string | null;
    logo_url: string | null;
}

export interface JobApplication {
    id: string;
    job_title: string;
    status: 'Applied' | 'Interview' | 'Offer' | 'Accepted' | 'Rejected';
    salary_range: string | null;
    location_type: string | null;
    applied_date: string;
    last_updated: string;
    companies?: Company;
}

export interface JobInterview {
    id: string;
    job_application_id: string;
    interview_type: string;
    interview_date: string;
    duration_minutes: number;
    meeting_link: string | null;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface JobEvent {
    id: string;
    job_application_id: string;
    event_type: string;
    description: string | null;
    old_status: string | null;
    new_status: string | null;
    created_at: string;
}
