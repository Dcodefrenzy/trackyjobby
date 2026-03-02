import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/jobs
 * Returns all job applications for the authenticated user, joined with their company details.
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { data: jobs, error } = await supabase
            .from('job_applications')
            .select(`
                id,
                job_title,
                status,
                salary_range,
                location_type,
                applied_date,
                last_updated,
                companies (
                    name,
                    domain,
                    logo_url
                ),
                job_application_events (*)
            `)
            .eq('user_id', req.userId)
            .order('last_updated', { ascending: false });

        if (error) {
            console.error('❌ Error fetching jobs from Supabase:', error);
            return res.status(500).json({ error: 'Failed to fetch job applications' });
        }

        // Flatten the company object out so it perfectly matches the frontend's mock format expectation
        const formattedJobs = jobs?.map(job => {
            // Supabase typing might infer this as an array if not strictly typed, so we cast it
            const companyData = (Array.isArray(job.companies) ? job.companies[0] : job.companies) as any;

            return {
                id: job.id,
                jobTitle: job.job_title,
                status: job.status,
                salary: job.salary_range,
                location: job.location_type || 'Unknown',
                appliedDate: job.applied_date,
                updated: job.last_updated,
                company: companyData?.name || 'Unknown',
                domain: companyData?.domain || '',
                logo: companyData?.logo_url || null,
                events: (job.job_application_events as any[])?.map(event => ({
                    id: event.id,
                    type: event.event_type,
                    description: event.description,
                    oldStatus: event.old_status,
                    newStatus: event.new_status,
                    createdAt: event.created_at
                })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || []
            };
        }) || [];

        return res.json({ jobs: formattedJobs });
    } catch (err) {
        console.error('❌ Unexpected error fetching jobs:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/jobs/interviews
 * Returns upcoming interviews for the authenticated user.
 */
router.get('/interviews', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: interviews, error } = await supabase
            .from('job_interviews')
            .select(`
                id,
                interview_type,
                interview_date,
                meeting_link,
                status,
                job_applications!inner (
                    job_title,
                    companies (
                        name
                    )
                )
            `)
            .eq('job_applications.user_id', req.userId)
            .gte('interview_date', todayStart.toISOString())
            .order('interview_date', { ascending: true });

        if (error) {
            console.error('❌ Error fetching interviews:', error);
            return res.status(500).json({ error: 'Failed to fetch interviews' });
        }

        const formattedInterviews = interviews?.map(inv => {
            const job = inv.job_applications as any;
            const company = job.companies as any;
            return {
                id: inv.id,
                type: inv.interview_type,
                date: inv.interview_date,
                link: inv.meeting_link,
                status: inv.status,
                jobTitle: job.job_title,
                companyName: company.name
            };
        }) || [];

        return res.json({ interviews: formattedInterviews });
    } catch (err) {
        console.error('❌ Unexpected error fetching interviews:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
