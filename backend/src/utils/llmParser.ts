import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

export interface InterviewData {
    interviewType: string;
    interviewDate: string | null; // ISO format or null
    durationMinutes: number | null;
    meetingLink: string | null;
}

export interface JobData {
    category?: 'job' | 'housing' | 'school' | 'scholarship';
    companyName: string;
    companyDomain: string | null;
    jobTitle: string;
    status: string;
    salaryRange: string | null;
    locationType: 'Remote' | 'On-site' | 'Hybrid' | 'Unknown';
    interviews: InterviewData[];
    sourceUrl?: string;
    notes: string | null;
}

export interface ParserResult {
    isJobRelated: boolean;
    jobData: JobData | null;
}

export async function parseJobEmail(
    subject: string,
    bodyText: string
): Promise<ParserResult> {
    try {
        const prompt = `
You are an AI assistant for an application tracking system called "TrackyJobby".
Your job is to read an incoming email and determine if it is related to a SPECIFIC personal application progress for jobs, housing, schools, or scholarships. 
An "Application" email is strictly one of:
- Application Confirmation ("Thank you for applying to [Role/Listing]")
- Interview / Viewing Invite ("We'd like to interview you / schedule a viewing for [Role/Listing]")
- Offer / Acceptance
- Rejection

CRITICAL: General "Job Alerts", "Daily Matches", or newsletters are NOT personal applications.

Evaluate the following email (Current Date: ${new Date().toISOString()}):
Subject: ${subject}
Body: ${bodyText}

1. If this email is NOT a specific personal application update, set "isJobRelated" to false and return null.
3. If this email IS an application, set "isJobRelated" to true and extract the following:
   - "category": MUST be exactly one of: "job", "housing", "school", "scholarship". Default to "job".
   - "companyName": The name of the hiring company, university, or landlord. Look for the real entity name.
   - "companyDomain": The primary website domain of the entity.
   - "jobTitle": The role, property listing, or programme applied for.
   - "status": The current status based on the email. MUST be exactly one of: "Bookmarked", "Applied", "Interview", "Offer", "Accepted", "Rejected", "Waitlisted", "Viewing", "Awarded". Defaults to "Applied" if it's just a confirmation.
   - "salaryRange": Any salary, compensation, or price mentioned. Null if not mentioned.
   - "locationType": MUST be exactly one of: "Remote", "On-site", "Hybrid", "Unknown". Try to infer from the text. Use "Unknown" if not stated.
   - "notes": A brief summary of the job description, key requirements, or any important details found in the email.
   - "interviews": An array of any interview rounds or viewings scheduled in the email. Each MUST have "interviewType". For "interviewDate", resolve relative dates into a full ISO string (assume futures dates).

Respond ONLY with raw JSON in the following format, with no markdown code blocks:
{
  "isJobRelated": true|false,
  "jobData": { "category": "...", "companyName": "...", "companyDomain": "...", "jobTitle": "...", "status": "...", "salaryRange": "...", "locationType": "...", "notes": "...", "interviews": [] }
}
`;

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '{}';
        console.log('🤖 LLM Raw Response:', content);
        const parsed = JSON.parse(content);

        return {
            isJobRelated: !!parsed.isJobRelated,
            jobData: parsed.jobData || null,
        };
    } catch (err) {
        console.error('LLM Parser error:', err);
        return { isJobRelated: false, jobData: null };
    }
}

export async function parsePageContent(pageText: string, url: string, domain: string): Promise<JobData | null> {
    try {
        const prompt = `
You are an AI assistant for TrackyJobby. Your job is to extract structured application details from raw web page text.

Evaluate the following web page content:
URL: ${url}
Domain: ${domain}
Text: ${pageText.substring(0, 3000)}

Extract the following information as structured JSON:
- "category": The type of listing. MUST be exactly one of: "job", "housing", "school", "scholarship". Default to "job".
- "companyName": The name of the hiring company, university, or landlord. Do NOT simply use the job board site name (like LinkedIn) unless the job is actually AT LinkedIn.
- "companyDomain": The primary official website domain of the hiring company (e.g. 'acme.com', 'contabo.com'). **CRITICAL: NEVER return a job board domain like 'linkedin.com', 'glassdoor.com', 'indeed.com', 'workday.com', 'lever.co' or 'smartrecruiters.com' unless the role is literally working AT that company.** If you can only see the job board URL, ignore it and return null for this field. Always prioritize the actual company's official website.
- "jobTitle": The role, property listing, or programme name.
- "status": MUST be exactly "Bookmarked".
- "salaryRange": Any salary, price, or compensation mentioned. Null if not mentioned.
- "locationType": MUST be exactly one of: "Remote", "On-site", "Hybrid", "Unknown". Try to infer from the text. Use "Unknown" if not stated.
- "notes": A concise summary of the job description, role responsibilities, or listing details extracted from the page text.

**CRITICAL: If the provided text does NOT contain any substantive details of a specific job, house, or educational listing (e.g. it's just a notifications feed, a search results page with 20 items, or a generic home page), return null for the entire JSON object.** Otherwise, return:
{ "category": "...", "companyName": "...", "companyDomain": "...", "jobTitle": "...", "status": "Bookmarked", "salaryRange": "...", "locationType": "...", "notes": "...", "interviews": [] }
`;

        console.log(`🤖 Sending prompt to LLM (${domain}). Text length: ${pageText.length}`);
        // console.log("DEBUG PROMPT:", prompt); // Uncomment only for deep debugging
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '{}';
        console.log('🤖 LLM Raw Page Parser Response:', content);
        return JSON.parse(content) as JobData;
    } catch (err) {
        console.error('LLM Page Parser error:', err);
        return null;
    }
}
