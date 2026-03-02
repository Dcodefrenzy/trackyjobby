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
    companyName: string;
    companyDomain: string | null;
    jobTitle: string;
    status: 'Applied' | 'Interview' | 'Offer' | 'Accepted' | 'Rejected';
    salaryRange: string | null;
    locationType: 'Remote' | 'On-site' | 'Hybrid' | 'Unknown';
    interviews: InterviewData[];
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
You are an AI assistant for a job application tracking system called "TrackyJobby".
Your job is to read an incoming email and determine if it is related to a SPECIFIC personal job application progress. 
A "Job Application" email is strictly one of:
- Application Confirmation ("Thank you for applying to [Role]")
- Interview Invite ("We'd like to interview you for [Role]")
- Job Offer ("We are excited to offer you the position of [Role]")
- Rejection ("We won't be moving forward with your application for [Role]")

CRITICAL: General "Job Alerts", "Job Recommendations", "Daily Matches", or marketing newsletters are NOT job applications. If the email contains a list of multiple jobs or says "New jobs for you at [Company]", set "isJobRelated" to false.

Evaluate the following email (Current Date: ${new Date().toISOString()}):
Subject: ${subject}
Body: ${bodyText}

1. If this email is NOT a specific personal application update, set "isJobRelated" to false and return null for "jobData".
3. If this email IS a job application, set "isJobRelated" to true and extract the following information as structured JSON in the "jobData" field:
   - "companyName": The name of the ACTUAL hiring company, NOT the job board or platform. For example, if the user receives an email via Indeed or LinkedIn about a job at "Vertex Corp", the companyName is "Vertex Corp", NOT "Indeed" or "LinkedIn".
   - "companyDomain": The primary website domain of the ACTUAL hiring company (e.g., 'vertex.com'). If the email is sent via a job board (e.g., 'member@linkedin.com'), ignore the sender domain and try to find the hiring company's actual domain mentioned in the body.
   - "jobTitle": The role or position applied for. Look extremely carefully in the Subject line and the first few paragraphs of the body. It is often near keywords like "Position:", "Role:", "Application for", or "[Company] - [Role]". If the subject is "Interview with Langdock", and the body says "our Frontend role", the title is "Frontend Developer". DO NOT use "Unknown" if you can find any indication of the role.
   - "status": The current status of the application based on the email context. MUST be exactly one of these strings: "Applied", "Interview", "Offer", "Accepted", "Rejected". Defaults to "Applied" if it's just a confirmation.
   - "salaryRange": Any salary or compensation mentioned (e.g., "$100k-$120k", "£50k"). Null if not mentioned.
   - "locationType": MUST be exactly one of: "Remote", "On-site", "Hybrid", "Unknown". Try to infer from the text. If not stated, use "Unknown".
   - "interviews": An array of any interview rounds scheduled in the email. Each object MUST have "interviewType" (e.g., "Technical Round", "Founder Chat"). Avoid generic titles like "On" or "Click here". For "interviewDate", use the provided Current Date context to resolve relative dates (e.g., "next Tuesday", "tomorrow at 3pm") into a full ISO string. CRITICAL: Interviews are almost always in the FUTURE. If a date like "Dec 8" is mentioned and today is Feb 28, 2026, you MUST assume the date is Dec 8, 2026, UNLESS the email explicitly describes a past event. Include "durationMinutes" (integer or null), and "meetingLink" (string or null).

Respond ONLY with raw JSON in the following format, with no markdown code blocks:
{
  "isJobRelated": true|false,
  "jobData": { "companyName": "...", "companyDomain": "...", "jobTitle": "...", "status": "...", "salaryRange": "...", "locationType": "...", "interviews": [] }
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
