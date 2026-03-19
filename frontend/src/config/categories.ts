export const CATEGORIES = {
    job: {
        id: 'job',
        label: 'Jobs',
        icon: 'Briefcase',
        statuses: ['Bookmarked', 'Applied', 'Interview', 'Offer', 'Accepted', 'Rejected'],
        fields: { title: 'Job Title', entity: 'Company' },
        interviewLabel: 'Interview'
    },
    housing: {
        id: 'housing',
        label: 'Housing',
        icon: 'Home',
        statuses: ['Bookmarked', 'Applied', 'Viewing', 'Offer', 'Accepted', 'Rejected'],
        fields: { title: 'Property / Listing', entity: 'Landlord / Agency' },
        interviewLabel: 'Viewing'
    },
    school: {
        id: 'school',
        label: 'Schools',
        icon: 'GraduationCap',
        statuses: ['Bookmarked', 'Applied', 'Interview', 'Waitlisted', 'Accepted', 'Rejected'],
        fields: { title: 'Programme', entity: 'University' },
        interviewLabel: 'Interview'
    },
    scholarship: {
        id: 'scholarship',
        label: 'Scholarships',
        icon: 'Award',
        statuses: ['Bookmarked', 'Applied', 'Interview', 'Waitlisted', 'Awarded', 'Rejected'],
        fields: { title: 'Scholarship Name', entity: 'Provider' },
        interviewLabel: 'Interview'
    },
} as const;

export type CategoryId = keyof typeof CATEGORIES;
