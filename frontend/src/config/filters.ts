import type { CategoryId } from './categories';

export interface FilterOption {
    id: string;
    label: string;
    keywords: string[];
}

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'Emails in English' },
    { code: 'de', label: 'Emails in German' },
    // Want to add French? Just add { code: 'fr', label: 'Emails in French' } here
    // and then add the 'fr' object to PREDEFINED_FILTERS below!
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const PREDEFINED_FILTERS: Record<LanguageCode, Record<CategoryId, FilterOption[]>> = {
    en: {
        job: [
            { id: 'en_job_gen', label: 'Job/Career', keywords: ['subject:job', 'subject:career'] },
            { id: 'en_job_int', label: 'Interview/Offer', keywords: ['subject:interview', 'subject:offer'] },
            { id: 'en_job_rec', label: 'Recruiter/Hiring', keywords: ['recruiter', 'hiring'] },
            { id: 'en_job_app', label: 'Application terms', keywords: ['"job application"'] },
            { id: 'en_job_plat', label: 'Job Platforms', keywords: ['@greenhouse.io', '@lever.co', '@workday.com', '@ashbyhq.com'] }
        ],
        housing: [
            { id: 'en_house_gen', label: 'Housing/Apartment', keywords: ['housing', 'apartment', 'property'] },
            { id: 'en_house_lease', label: 'Lease/Tenant', keywords: ['lease', 'tenant', 'landlord'] },
            { id: 'en_house_view', label: 'Viewing/Rental', keywords: ['viewing', 'rental'] },
            { id: 'en_house_plat', label: 'Housing Sites', keywords: ['@zillow.com', '@streeteasy.com', '@redfin.com'] }
        ],
        school: [
            { id: 'en_school_adm', label: 'Admission/Enrollment', keywords: ['admission', 'enrollment'] },
            { id: 'en_school_uni', label: 'University/College', keywords: ['university', 'college', '"programme"'] },
            { id: 'en_school_app', label: 'Application Status', keywords: ['"application status"'] },
            { id: 'en_school_plat', label: 'School Platforms', keywords: ['@commonapp.org', '@applytexas.org'] }
        ],
        scholarship: [
            { id: 'en_schol_gen', label: 'Scholarship/Grant', keywords: ['scholarship', 'grant'] },
            { id: 'en_schol_awd', label: 'Award/Bursary', keywords: ['award', 'bursary', 'fellowship'] },
            { id: 'en_schol_plat', label: 'Funding Sites', keywords: ['@bold.org', '@scholarships.com'] }
        ]
    },
    de: {
        job: [
            { id: 'de_job_gen', label: 'Bewerbung/Karriere', keywords: ['subject:bewerbung', 'subject:karriere', '"ihre bewerbung"'] },
            { id: 'de_job_int', label: 'Interview/Gespräch', keywords: ['subject:vorstellungsgespräch', 'subject:interview', 'kennenlernen'] },
            { id: 'de_job_rec', label: 'Recruiter/Personal', keywords: ['recruiter', 'personal', 'hiring'] },
            { id: 'de_job_app', label: 'Vertrag/Zusage', keywords: ['arbeitsvertrag', 'zusage', '"ihre unterlagen"'] },
            { id: 'de_job_plat', label: 'Job Platforms', keywords: ['@stepstone.de', '@xing.com', '@linkedin.com'] }
        ],
        housing: [
            { id: 'de_house_gen', label: 'Wohnung/Immobilie', keywords: ['wohnung', 'immobilie', 'apartment'] },
            { id: 'de_house_lease', label: 'Miete/Mieter', keywords: ['miete', 'mieter', 'vermieter'] },
            { id: 'de_house_view', label: 'Besichtigung', keywords: ['besichtigung', 'besichtigungstermin'] },
            { id: 'de_house_plat', label: 'Housing Sites', keywords: ['@immobilienscout24.de', '@immowelt.de'] }
        ],
        school: [
            { id: 'de_school_adm', label: 'Zulassung/Immatrikulation', keywords: ['zulassung', 'immatrikulation'] },
            { id: 'de_school_uni', label: 'Universität/Hochschule', keywords: ['universität', 'hochschule', 'studium'] },
            { id: 'de_school_app', label: 'Bewerbungsstatus', keywords: ['"status ihrer bewerbung"'] },
            { id: 'de_school_plat', label: 'School Platforms', keywords: ['@hochschulstart.de'] }
        ],
        scholarship: [
            { id: 'de_schol_gen', label: 'Stipendium/Förderung', keywords: ['stipendium', 'förderung'] },
            { id: 'de_schol_awd', label: 'Auszeichnung', keywords: ['auszeichnung', 'bafög'] },
            { id: 'de_schol_plat', label: 'Funding Sites', keywords: ['@stiftungen.org'] }
        ]
    }
    // fr: { ... }
};
