import { create } from 'zustand';
import {
    recruitmentApi,
    type CandidateDetail,
    type HireResult,
    type HireStatus,
    type HpSearchResult,
} from '../../services/api/recruitment';

interface CompleteHireEmploymentDetails {
    fid: string;
    employment_type: string;
    designation: string;
    start_date: string;
    end_date?: string;
}

interface RecruitmentCandidateProfileStore {
    activeCandidateId: string | null;
    candidate: CandidateDetail | null;
    hireStatus: HireStatus | null;
    loading: boolean;
    completing: boolean;
    optionsLoading: boolean;
    employmentTypeOptions: string[];
    hpSearchTerm: string;
    hpSearchBy: string;
    hpSearchResults: HpSearchResult[];
    hpSearching: boolean;
    hpLinking: boolean;
    reset: () => void;
    loadCandidate: (candidateId: string) => Promise<void>;
    loadEmploymentTypeOptions: () => Promise<void>;
    completeHire: (candidateId: string, employmentDetails: CompleteHireEmploymentDetails) => Promise<HireResult>;
    setHpSearchTerm: (value: string) => void;
    setHpSearchBy: (value: string) => void;
    clearHpSearch: () => void;
    searchHpForApplicant: () => Promise<number>;
    linkHpToApplicant: (candidateId: string, hpName: string) => Promise<void>;
}

let profileRequestCounter = 0;

const initialProfileState = {
    activeCandidateId: null,
    candidate: null,
    hireStatus: null,
    loading: false,
    completing: false,
    optionsLoading: false,
    employmentTypeOptions: [] as string[],
    hpSearchTerm: '',
    hpSearchBy: 'registration_number',
    hpSearchResults: [] as HpSearchResult[],
    hpSearching: false,
    hpLinking: false,
};

const useRecruitmentCandidateProfileStore = create<RecruitmentCandidateProfileStore>((set, get) => ({
    ...initialProfileState,

    reset: () => {
        set({ ...initialProfileState });
    },

    loadCandidate: async (candidateId) => {
        const requestId = ++profileRequestCounter;
        set({
            loading: true,
            activeCandidateId: candidateId,
            candidate: null,
            hireStatus: null,
        });

        try {
            const resp = await recruitmentApi.getCandidateDetail(candidateId);
            if (requestId !== profileRequestCounter) return;

            const candidate = (resp?.data as CandidateDetail) || null;
            const nextState: Partial<RecruitmentCandidateProfileStore> = {
                candidate,
                hireStatus: null,
            };

            if (candidate?.job_offers?.length) {
                const statusTarget = candidate.job_offers.find((offer) => offer.status === 'Accepted') || candidate.job_offers[0];
                if (statusTarget?.name) {
                    try {
                        const status = await recruitmentApi.checkHireStatus(statusTarget.name);
                        if (requestId !== profileRequestCounter) return;
                        nextState.hireStatus = status;
                    } catch {
                        nextState.hireStatus = null;
                    }
                }
            }

            set(nextState);
        } finally {
            if (requestId === profileRequestCounter) {
                set({ loading: false });
            }
        }
    },

    loadEmploymentTypeOptions: async () => {
        set({ optionsLoading: true });
        try {
            const options = await recruitmentApi.getJobOpeningFormOptions();
            set({
                employmentTypeOptions: Array.isArray(options?.employment_types) ? options.employment_types : [],
            });
        } catch {
            set({ employmentTypeOptions: [] });
        } finally {
            set({ optionsLoading: false });
        }
    },

    completeHire: async (candidateId, employmentDetails) => {
        const candidate = get().candidate;
        const acceptedOffer = candidate?.job_offers?.find((offer) => offer.status === 'Accepted');
        if (!acceptedOffer) {
            throw new Error('No accepted job offer found for this candidate');
        }

        set({ completing: true });
        try {
            const result = await recruitmentApi.completeHire({
                job_offer_id: acceptedOffer.name,
                employment_details: employmentDetails,
            });
            await get().loadCandidate(candidateId);
            return result;
        } finally {
            set({ completing: false });
        }
    },

    setHpSearchTerm: (value) => {
        set({ hpSearchTerm: value });
    },

    setHpSearchBy: (value) => {
        set({ hpSearchBy: value });
    },

    clearHpSearch: () => {
        set({
            hpSearchTerm: '',
            hpSearchResults: [],
        });
    },

    searchHpForApplicant: async () => {
        const term = get().hpSearchTerm.trim();
        if (!term) {
            set({ hpSearchResults: [] });
            return 0;
        }

        set({
            hpSearching: true,
            hpSearchResults: [],
        });
        try {
            const resp = await recruitmentApi.searchHpForApplicant({
                search_term: term,
                search_by: get().hpSearchBy,
            });
            const results = Array.isArray(resp?.data?.results) ? resp.data.results : [];
            set({
                hpSearchResults: results,
            });
            return results.length;
        } finally {
            set({ hpSearching: false });
        }
    },

    linkHpToApplicant: async (candidateId, hpName) => {
        set({ hpLinking: true });
        try {
            await recruitmentApi.linkApplicantToHp({
                job_applicant: candidateId,
                hp_name: hpName,
            });
            set({
                hpSearchTerm: '',
                hpSearchResults: [],
            });
            await get().loadCandidate(candidateId);
        } finally {
            set({ hpLinking: false });
        }
    },
}));

export default useRecruitmentCandidateProfileStore;
