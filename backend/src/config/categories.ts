export const CATEGORIES = {
    job: {
        label: 'Jobs',
        icon: 'Briefcase',
        statuses: ['Bookmarked', 'Applied', 'Interview', 'Offer', 'Accepted', 'Rejected'],
        fields: { title: 'Job Title', entity: 'Company' },
        interviewLabel: 'Interview',
    },
    housing: {
        label: 'Housing',
        icon: 'Home',
        statuses: ['Bookmarked', 'Applied', 'Viewing', 'Offer', 'Accepted', 'Rejected'],
        fields: { title: 'Property / Listing', entity: 'Landlord / Agency' },
        interviewLabel: 'Viewing',
    },
    school: {
        label: 'Schools',
        icon: 'GraduationCap',
        statuses: ['Bookmarked', 'Applied', 'Interview', 'Waitlisted', 'Accepted', 'Rejected'],
        fields: { title: 'Programme', entity: 'University' },
        interviewLabel: 'Interview',
    },
    scholarship: {
        label: 'Scholarships',
        icon: 'Award',
        statuses: ['Bookmarked', 'Applied', 'Interview', 'Waitlisted', 'Awarded', 'Rejected'],
        fields: { title: 'Scholarship Name', entity: 'Provider' },
        interviewLabel: 'Interview',
    },
};
