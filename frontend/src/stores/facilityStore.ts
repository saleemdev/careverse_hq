/**
 * Facility Context Zustand Store
 * Manages health facility selection and company context
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getCsrfToken } from '../utils/csrf';
import { notifyApiError } from '../utils/notifications';

const getErrorMessage = (error: unknown) => {
	if (error instanceof Error) return error.message;
	return 'Unexpected error';
};

export interface Facility {
	hie_id: string;
	facility_name: string;
	facility_mfl: string | null;
	facility_type: string;
	category: string;
	organization_company: string;
	region_company: string;
	county: string;
	sub_county?: string;
}

export interface Company {
	name: string;
	company_name: string;
	abbr: string;
	company_logo?: string;
	country?: string;
	default_currency?: string;
}

export type AccessMode = 'none' | 'company' | 'oversight';

interface FacilityState {
	// State
	company: Company | null;
	accessMode: AccessMode;
	availableFacilities: Facility[];
	selectedFacilities: Facility[];
	selectedFacilityIds: string[]; // Memoized IDs to prevent re-render loops
	loading: boolean;
	error: string | null;

	// Actions
	loadCompanyAndFacilities: () => Promise<void>;
	setSelectedFacilities: (facilities: Facility[]) => void;
	clearFacilities: () => void;
	refreshFacilities: () => Promise<void>;
	reset: () => void;

	// Computed
	isAllFacilities: () => boolean;
	getSelectedFacilityIds: () => string[];
}

const useFacilityStore = create<FacilityState>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial State
				company: null,
				accessMode: 'none',
				availableFacilities: [],
				selectedFacilities: [],
				selectedFacilityIds: [],
				loading: false,
				error: null,

				/**
				 * Load user's company permission and available facilities
				 */
				loadCompanyAndFacilities: async () => {
					set({ loading: true, error: null });

					try {
						const response = await fetch('/api/method/careverse_hq.api.user_context.get_user_company_context', {
							credentials: 'include',
							headers: {
								Accept: 'application/json',
								'X-Frappe-CSRF-Token': getCsrfToken(),
							},
						});

						if (!response.ok) {
							throw new Error('Failed to fetch company context');
						}

						const data = await response.json();

						// Extract data from Frappe API response structure
						// Frappe wraps responses in { message: { status: "success", data: {...} } }
						const apiResponse = data.message || data;
						const result = apiResponse.data || apiResponse;

						console.log('[FacilityStore] Parsed Result:', result);

						const rawAccessMode = result.access_mode;
						const accessMode: AccessMode =
							rawAccessMode === 'company' || rawAccessMode === 'oversight' || rawAccessMode === 'none'
								? rawAccessMode
								: result.has_company_permission
									? 'company'
									: result.is_oversight_user
										? 'oversight'
									: 'none';

						if (accessMode === 'none') {
							set({
								accessMode: 'none',
								company: null,
								availableFacilities: [],
								selectedFacilities: [],
								selectedFacilityIds: [],
								loading: false,
								error: null,
							});
							return;
						}

						// Both company and oversight get full access.
						const facilities = result.facilities || [];
						const allIds = facilities.map((f: Facility) => f.hie_id);
						set({
							accessMode: 'company',
							company: result.company,
							availableFacilities: facilities,
							selectedFacilities: [],
							selectedFacilityIds: allIds,
							loading: false,
							error: null,
						});
					} catch (error: unknown) {
						console.error('[FacilityStore] Error loading company context:', error);
						const msg = getErrorMessage(error) || 'Failed to load company context';
						notifyApiError(msg, 'load your account context');
						// Preserve current accessMode on transient errors so authenticated
						// users are not incorrectly kicked to "Organization Access Required".
						set((prev) => ({
							...prev,
							error: msg,
							loading: false,
						}));
					}
				},

				/**
				 * Set selected facilities (multiselect)
				 */
				setSelectedFacilities: (facilities) => {
					const { availableFacilities } = get();

					// Only allow selection from available facilities (validation)
					const validSelection = facilities.filter((f) => availableFacilities.some((af) => af.hie_id === f.hie_id));

					set({
						selectedFacilities: validSelection,
						selectedFacilityIds: validSelection.map((f) => f.hie_id),
					});
				},

				/**
				 * Clear selection (All facilities mode)
				 */
				clearFacilities: () => {
					set({
						selectedFacilities: [],
						selectedFacilityIds: get().availableFacilities.map((f) => f.hie_id),
					});
				},

				/**
				 * Refresh facilities list from backend
				 */
				refreshFacilities: async () => {
					const { company, accessMode } = get();
					if (!company || accessMode !== 'company') return;

					set({ loading: true, error: null });

					try {
						const response = await fetch(
							`/api/method/careverse_hq.api.user_context.get_facilities_for_company?company=${encodeURIComponent(company.name)}`,
							{
								credentials: 'include',
								headers: {
									Accept: 'application/json',
									'X-Frappe-CSRF-Token': getCsrfToken(),
								},
							}
						);

						if (!response.ok) {
							throw new Error('Failed to refresh facilities');
						}

						const data = await response.json();

						// Extract data from Frappe API response structure
						const apiResponse = data.message || data;
						const result = apiResponse.data || apiResponse;
						const facilities = result.facilities || [];
						const allIds = facilities.map((f: Facility) => f.hie_id);

						set({
							accessMode: 'company',
							availableFacilities: facilities,
							selectedFacilities: [],
							selectedFacilityIds: allIds,
							loading: false,
							error: null,
						});
					} catch (error: unknown) {
						console.error('[FacilityStore] Error refreshing facilities:', error);
						const msg = getErrorMessage(error) || 'Failed to refresh facilities';
						notifyApiError(msg, 'refresh facilities');
						set({
							error: msg,
							loading: false,
						});
					}
				},

				/**
				 * Reset store to initial state
				 */
				reset: () =>
					set({
						company: null,
						accessMode: 'none',
						availableFacilities: [],
						selectedFacilities: [],
						selectedFacilityIds: [],
						loading: false,
						error: null,
					}),

				/**
				 * Check if "All Facilities" mode (no selection)
				 */
				isAllFacilities: () => {
					return get().selectedFacilities.length === 0;
				},

				/**
				 * Get selected facility IDs for API calls
				 */
				getSelectedFacilityIds: () => {
					const { selectedFacilities, availableFacilities } = get();
					if (selectedFacilities.length === 0) {
						return availableFacilities.map((f) => f.hie_id);
					}
					return selectedFacilities.map((f) => f.hie_id);
				},
			}),
			{
				name: 'f360-facility-context-store',
				partialize: (state) => ({
					accessMode: state.accessMode,
					company: state.company,
					availableFacilities: state.availableFacilities,
					selectedFacilityIds: state.availableFacilities.map((f) => f.hie_id),
				}),
			}
		),
		{
			name: 'facility-context-store',
		}
	)
);

export default useFacilityStore;
