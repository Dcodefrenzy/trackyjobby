import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';
import { processJobApplication } from '../services/jobApplicationService';
import { parsePageContent, JobData } from '../utils/llmParser';

const router = Router();

/**
 * GET /api/jobs/recent
 * Returns the most recently updated 5 job applications (for extension "Recent Activity").
 */
router.get('/recent', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { data: jobs, error } = await supabase
            .from('job_applications')
            .select(`
                id,
                category,
                job_title,
                status,
                last_updated,
                companies (
                    name,
                    logo_url
                )
            `)
            .eq('user_id', req.userId)
            .order('last_updated', { ascending: false })
            .limit(5);

        if (error) {
            console.error('❌ Error fetching recent jobs:', error);
            return res.status(500).json({ error: 'Failed to fetch recent data' });
        }

        const formatted = jobs?.map(job => ({
            id: job.id,
            category: job.category,
            jobTitle: job.job_title,
            status: job.status,
            company: (Array.isArray(job.companies) ? job.companies[0]?.name : (job.companies as any)?.name) || 'Unknown',
            logo: (Array.isArray(job.companies) ? job.companies[0]?.logo_url : (job.companies as any)?.logo_url) || null,
            updated: job.last_updated
        }));

        res.json(formatted);
    } catch (err) {
        console.error('❌ Server error getting recent:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/jobs
 * Returns all job applications for the authenticated user, joined with their company details.
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const category = (req.query.category as string) || 'job';

        const { data: jobs, error } = await supabase
            .from('job_applications')
            .select(`
                id,
                category,
                job_title,
                status,
                salary_range,
                location_type,
                applied_date,
                last_updated,
                source_url,
                notes,
                companies (
                    name,
                    domain,
                    logo_url
                ),
                job_application_events (*)
            `)
            .eq('user_id', req.userId)
            .eq('category', category)
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
                category: job.category,
                jobTitle: job.job_title,
                status: job.status,
                salary: job.salary_range,
                location: job.location_type || 'Unknown',
                appliedDate: job.applied_date,
                updated: job.last_updated,
                sourceUrl: job.source_url,
                notes: job.notes,
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
        const category = (req.query.category as string) || 'job';
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
            .eq('job_applications.category', category)
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

/**
 * DELETE /api/jobs/interviews/:id
 * Delete a specific job interview.
 */
router.delete('/interviews/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verify the interview belongs to a job owned by this user
        const { data: existing, error: fetchErr } = await supabase
            .from('job_interviews')
            .select(`
                id,
                job_applications!inner (user_id)
            `)
            .eq('id', id)
            .eq('job_applications.user_id', req.userId)
            .single();

        if (fetchErr || !existing) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const { error: deleteErr } = await supabase
            .from('job_interviews')
            .delete()
            .eq('id', id);

        if (deleteErr) {
            console.error('❌ Error deleting interview:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete interview' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('❌ Error deleting interview:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * PUT /api/jobs/:id
 * Update a job application (status, title, salary, location).
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, jobTitle, salary, location } = req.body;

        // Verify the application belongs to this user
        const { data: existing, error: fetchErr } = await supabase
            .from('job_applications')
            .select('id, status, job_title')
            .eq('id', id)
            .eq('user_id', req.userId)
            .single();

        if (fetchErr || !existing) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Build update payload (only include provided fields)
        const updateData: any = { last_updated: new Date().toISOString() };
        if (status !== undefined) updateData.status = status;
        if (jobTitle !== undefined) updateData.job_title = jobTitle;
        if (salary !== undefined) updateData.salary_range = salary;
        if (location !== undefined) updateData.location_type = location;
        if (req.body.notes !== undefined) updateData.notes = req.body.notes;

        await supabase.from('job_applications').update(updateData).eq('id', id);

        // Record status change event if status actually changed
        if (status && status !== existing.status) {
            await supabase.from('job_application_events').insert({
                job_application_id: id,
                event_type: 'Status Change',
                old_status: existing.status,
                new_status: status,
                description: `Status manually updated from ${existing.status} to ${status}.`
            });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('❌ Error updating job:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job application (cascades to events + interviews).
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verify the application belongs to this user
        const { data: existing, error: fetchErr } = await supabase
            .from('job_applications')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.userId)
            .single();

        if (fetchErr || !existing) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const { error: deleteErr } = await supabase
            .from('job_applications')
            .delete()
            .eq('id', id);

        if (deleteErr) {
            console.error('❌ Error deleting job:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete application' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('❌ Error deleting job:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/jobs/manual
 * Manually save a job/housing/school application via the Chrome Extension
 */
router.post('/manual', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { title, source_url, raw_text, category } = req.body;
        console.log(`📥 Received manual bookmark request for: ${source_url}`);
        console.log(`  - Extension Title: ${title}`);
        console.log(`  - Category Hint: ${category}`);
        console.log(`  - Raw Text Size: ${raw_text?.length || 0} chars`);

        if (!source_url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const domain = new URL(source_url).hostname.replace(/^www\./, '');
        
        // --- 1. PRELIMINARY SAVE (INSTANT) ---
        // We save the basic data from the extension immediately so the user can move on.
        const preliminaryData: JobData = {
            category: category || 'job', // Use user hint or default to job
            companyName: 'Processing...', 
            companyDomain: domain,
            jobTitle: title || 'Bookmarked Listing',
            status: 'Bookmarked',
            salaryRange: null,
            locationType: 'Unknown',
            interviews: [],
            notes: 'AI is currently analyzing the page content...',
            sourceUrl: source_url
        };

        const jobId = await processJobApplication(req.userId!, preliminaryData);
        
        // --- 2. RESPOND IMMEDIATELY ---
        res.json({ 
            success: true, 
            message: 'Saved to dashboard! AI is processing details...', 
            jobId 
        });

        // --- 3. BACKGROUND ENRICHMENT (FORGET) ---
        // We trigger the AI work without 'awaiting' it, so the connection closes first.
        (async () => {
            try {
                if (!raw_text) return;
                
                console.log(`🧠 Background AI starting for Job: ${jobId} (${domain})`);
                const enrichedData = await parsePageContent(raw_text, source_url, domain);
                
                if (!enrichedData) {
                    console.log(`ℹ️ Background AI found no substantive listing for ${jobId}. Keeping placeholder.`);
                    // Optionally update the notes to say "No details found"
                    await processJobApplication(req.userId!, { ...preliminaryData, notes: 'Note: AI scanned this page but found no clear job/housing details.' }, jobId);
                    return;
                }

                // Ensure sourceUrl stays consistent
                enrichedData.sourceUrl = source_url;
                
                // Update the existing record with real AI data
                await processJobApplication(req.userId!, enrichedData, jobId);
                console.log(`🏁 Background AI enrichment complete for ${jobId}`);

            } catch (bgErr) {
                console.error(`❌ Background AI failed for ${jobId}:`, bgErr);
            }
        })();

    } catch (err) {
        console.error('❌ Error saving manual bookmark:', err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
