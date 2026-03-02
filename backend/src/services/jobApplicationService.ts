import { supabase } from '../lib/supabase';
import { JobData } from '../utils/llmParser';

/**
 * Handles the logic for matching/inserting a company, checking for existing
 * duplicate applications, and inserting/updating the job application and interviews.
 */
export async function processJobApplication(userId: string, jobData: JobData, _fallbackIgnored?: string) {
    const jobTitle = jobData.jobTitle || 'Unknown';
    // ─── Resolve Company ───
    let companyId;

    // Try matching by domain first (it's more reliable than name)
    if (jobData.companyDomain) {
        const { data: domainMatch } = await supabase
            .from('companies')
            .select('id')
            .ilike('domain', jobData.companyDomain)
            .limit(1)
            .maybeSingle();

        if (domainMatch) {
            companyId = domainMatch.id;
            console.log(`🔗 Matched company "${jobData.companyName}" by domain: ${jobData.companyDomain}`);
        }
    }

    // Fallback to name match if no domain match or no domain provided
    if (!companyId) {
        const { data: nameMatch } = await supabase
            .from('companies')
            .select('id')
            .ilike('name', jobData.companyName)
            .maybeSingle();

        if (nameMatch) {
            companyId = nameMatch.id;
            console.log(`🔗 Matched company "${jobData.companyName}" by name.`);
        }
    }

    // Create new company if still no match
    if (!companyId) {
        const logoUrl = jobData.companyDomain ? `https://cdn.brandfetch.io/${jobData.companyDomain}?c=1idpPzZ5e4dgNRWVKYA` : null;
        const { data: newCompany, error: companyErr } = await supabase
            .from('companies')
            .insert({
                name: jobData.companyName,
                domain: jobData.companyDomain,
                logo_url: logoUrl
            })
            .select('id')
            .single();

        if (companyErr) {
            console.error('Company Insert Error:', companyErr);
            throw companyErr;
        }
        companyId = newCompany.id;
        console.log(`🆕 Created new company: ${jobData.companyName}`);
    }

    // ─── Duplicate Check Strategy ───
    // First, try a strict match (Company + Title)
    const { data: strictMatches } = await supabase
        .from('job_applications')
        .select('id, status, job_title')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .ilike('job_title', jobTitle)
        .order('created_at', { ascending: false });

    let existingJob = strictMatches?.find(j => j.status !== 'Rejected');

    // If no strict active match, try to find ANY active application for this company
    if (!existingJob) {
        const { data: companyJobs } = await supabase
            .from('job_applications')
            .select('id, status, job_title')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .neq('status', 'Rejected')
            .order('created_at', { ascending: false });

        if (companyJobs && companyJobs.length > 0) {
            existingJob = companyJobs[0];
            console.log(`⚠️ Fuzzy match found for company ${jobData.companyName}. Using existing app: ${existingJob.id} (${existingJob.job_title})`);
        }
    }

    let targetJobId;

    if (existingJob && existingJob.status !== 'Rejected') {
        const oldStatus = existingJob.status;
        targetJobId = existingJob.id;

        // Update existing application
        const updateData: any = {
            status: jobData.status,
            salary_range: jobData.salaryRange || null,
            location_type: jobData.locationType || null,
            last_updated: new Date().toISOString(),
        };

        // If current title is Unknown but we found a real one now, upgrade it!
        if (existingJob.job_title === 'Unknown' && jobData.jobTitle && jobData.jobTitle !== 'Unknown') {
            updateData.job_title = jobData.jobTitle;
            console.log(`✨ Upgraded job title from Unknown to: ${jobData.jobTitle}`);
        }

        await supabase.from('job_applications').update(updateData).eq('id', targetJobId);

        // Record status change event if it actually changed
        if (oldStatus !== jobData.status) {
            await supabase.from('job_application_events').insert({
                job_application_id: targetJobId,
                event_type: 'Status Change',
                old_status: oldStatus,
                new_status: jobData.status,
                description: `Application status moved from ${oldStatus} to ${jobData.status}.`
            });
        }
        console.log(`✅ Job Application Updated: ${targetJobId}`);
    } else {
        // Insert new application
        const { data: newJob, error: jobErr } = await supabase.from('job_applications').insert({
            user_id: userId,
            company_id: companyId,
            job_title: jobTitle,
            status: jobData.status,
            salary_range: jobData.salaryRange || null,
            location_type: jobData.locationType || null,
            applied_date: new Date().toISOString(),
        }).select('id').single();

        if (jobErr) {
            console.error('Job Insert Error:', jobErr);
            throw jobErr;
        }
        targetJobId = newJob.id;

        // Record initial event
        await supabase.from('job_application_events').insert({
            job_application_id: targetJobId,
            event_type: 'Status Change',
            old_status: null,
            new_status: jobData.status,
            description: `Application submitted for ${jobTitle} at ${jobData.companyName}.`
        });

        console.log(`✅ Job Application Created: ${targetJobId}`);
    }

    // ─── Insert Interviews ───
    if (jobData.interviews && jobData.interviews.length > 0) {
        const newlyAddedInterviews: string[] = [];

        for (const inv of jobData.interviews) {
            // Check if this specific interview already exists for this job
            const { data: existingInv } = await supabase
                .from('job_interviews')
                .select('id')
                .eq('job_application_id', targetJobId)
                .eq('interview_type', inv.interviewType || 'Scheduled Interview')
                .eq('interview_date', inv.interviewDate || null)
                .single();

            if (!existingInv) {
                const { error: invErr } = await supabase.from('job_interviews').insert({
                    job_application_id: targetJobId,
                    interview_type: inv.interviewType || 'Scheduled Interview',
                    interview_date: inv.interviewDate || null,
                    duration_minutes: inv.durationMinutes || null,
                    meeting_link: inv.meetingLink || null,
                    status: 'Scheduled'
                });

                if (!invErr) {
                    newlyAddedInterviews.push(inv.interviewType || 'Interview');
                    console.log(`📅 Created Job Interview: ${inv.interviewType}`);
                }
            }
        }

        // Record a SINGLE history event for all new interviews found in this email
        if (newlyAddedInterviews.length > 0) {
            const descriptions = jobData.interviews
                .filter(inv => newlyAddedInterviews.includes(inv.interviewType || 'Interview'))
                .map(inv => `${inv.interviewType}${inv.interviewDate ? ' (' + new Date(inv.interviewDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + ')' : ''}`);

            const summary = newlyAddedInterviews.length === 1
                ? `New interview scheduled: ${descriptions[0]}`
                : `${newlyAddedInterviews.length} interview rounds scheduled: ${descriptions.join('; ')}`;

            await supabase.from('job_application_events').insert({
                job_application_id: targetJobId,
                event_type: 'Interview Scheduled',
                new_status: jobData.status,
                description: summary
            });
        }
    }

    return targetJobId;
}
