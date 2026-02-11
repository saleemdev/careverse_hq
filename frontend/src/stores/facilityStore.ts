/**
 * Facility Context Zustand Store
 * Manages health facility selection and company context
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

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
	country?: string;
	default_currency?: string;
}

interface FacilityState {
	// State
	company: Company | null;
	hasCompanyPermission: boolean;
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
				hasCompanyPermission: false,
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
						const response = await fetch(
							'/api/method/careverse_hq.api.user_context.get_user_company_context',
							{
								credentials: 'include',
								headers: {
									'Accept': 'application/json',
									'X-Frappe-CSRF-Token': (window as any).csrf_token || '',
								},
							}
						);

						if (!response.ok) {
							throw new Error('Failed to fetch company context');
						}

						const data = await response.json();

						// Debug logging
						console.log('[FacilityStore] API Response:', data);

						// Extract data from Frappe API response structure
						// Frappe wraps responses in { message: { status: "success", data: {...} } }
						const apiResponse = data.message || data;
						const result = apiResponse.data || apiResponse;

						console.log('[FacilityStore] Parsed Result:', result);

						if (!result.has_permission) {
							set({
								hasCompanyPermission: false,
								company: null,
								availableFacilities: [],
								selectedFacilities: [],
								loading: false,
							});
							return;
						}

						set({
							hasCompanyPermission: true,
							company: result.company,
							availableFacilities: result.facilities || [],
							selectedFacilityIds: (result.facilities || []).map((f: Facility) => f.hie_id),
							loading: false,
						});

						// Auto-select all facilities if previously selected
						const previousSelection = get().selectedFacilities;
						if (previousSelection.length > 0) {
							// Validate previous selection still exists
							const validSelection = previousSelection.filter((prev) =>
								result.facilities.some((f: Facility) => f.hie_id === prev.hie_id)
							);
							if (validSelection.length > 0) {
								set({
									selectedFacilities: validSelection,
									selectedFacilityIds: validSelection.map(f => f.hie_id)
								});
							}
						}
					} catch (error: any) {
						console.error('[FacilityStore] Error loading company context:', error);
						set({
							error: error.message || 'Failed to load company context',
							loading: false,
						});
					}
				},

				/**
				 * Set selected facilities (multiselect)
				 */
				setSelectedFacilities: (facilities) => {
					const { availableFacilities } = get();

					// Only allow selection from available facilities (validation)
					const validSelection = facilities.filter((f) =>
						availableFacilities.some((af) => af.hie_id === f.hie_id)
					);

					set({
						selectedFacilities: validSelection,
						selectedFacilityIds: validSelection.map(f => f.hie_id)
					});
				},

				/**
				 * Clear selection (All facilities mode)
				 */
				clearFacilities: () => {
					set({
						selectedFacilities: [],
						selectedFacilityIds: get().availableFacilities.map(f => f.hie_id)
					});
				},

				/**
				 * Refresh facilities list from backend
				 */
				refreshFacilities: async () => {
					const { company } = get();
					if (!company) return;

					set({ loading: true, error: null });

					try {
						const response = await fetch(
							`/api/method/careverse_hq.api.user_context.get_facilities_for_company?company=${encodeURIComponent(
								company.name
							)}`,
							{
								credentials: 'include',
								headers: {
									'Accept': 'application/json',
									'X-Frappe-CSRF-Token': (window as any).csrf_token || '',
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

						set({
							availableFacilities: result.facilities || [],
							loading: false,
						});
					} catch (error: any) {
						console.error('[FacilityStore] Error refreshing facilities:', error);
						set({
							error: error.message || 'Failed to refresh facilities',
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
						hasCompanyPermission: false,
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
						return availableFacilities.map(f => f.hie_id);
					}
					return selectedFacilities.map(f => f.hie_id);
				},
			}),
			{
				name: 'f360-facility-context-store',
				partialize: (state) => ({
					company: state.company,
					hasCompanyPermission: state.hasCompanyPermission,
					availableFacilities: state.availableFacilities,
					selectedFacilities: state.selectedFacilities,
				}),
			}
		),
		{
			name: 'facility-context-store',
		}
	)
);

export default useFacilityStore;
