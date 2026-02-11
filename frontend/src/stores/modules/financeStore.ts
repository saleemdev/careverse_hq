import { create } from 'zustand';
import { financeApi } from '../../services/api';

interface PurchaseOrder {
    name: string;
    supplier: string;
    transaction_date: string;
    grand_total: number;
    status: string;
    currency: string;
}

interface ExpenseClaim {
    name: string;
    employee_name: string;
    posting_date: string;
    total_claimed_amount: number;
    status: string;
}

interface MaterialRequest {
    name: string;
    transaction_date: string;
    status: string;
    material_request_type: string;
}

interface FinanceModuleState {
    purchaseOrders: PurchaseOrder[];
    expenseClaims: ExpenseClaim[];
    materialRequests: MaterialRequest[];
    loading: Record<string, boolean>;
    filters: {
        page: number;
        pageSize: number;
        status: string;
    };
    fetchPurchaseOrders: () => Promise<void>;
    fetchExpenseClaims: () => Promise<void>;
    fetchMaterialRequests: () => Promise<void>;
    setFilters: (filters: Partial<FinanceModuleState['filters']>) => void;
}

const useFinanceModuleStore = create<FinanceModuleState>((set, get) => ({
    purchaseOrders: [],
    expenseClaims: [],
    materialRequests: [],
    loading: { po: false, ec: false, mr: false },
    filters: {
        page: 1,
        pageSize: 10,
        status: '',
    },
    fetchPurchaseOrders: async () => {
        set((state) => ({ loading: { ...state.loading, po: true } }));
        try {
            const response = await financeApi.getPurchaseOrders(get().filters);
            if (response.success) {
                set({ purchaseOrders: response.data || [] });
            }
        } finally {
            set((state) => ({ loading: { ...state.loading, po: false } }));
        }
    },
    fetchExpenseClaims: async () => {
        set((state) => ({ loading: { ...state.loading, ec: true } }));
        try {
            const response = await financeApi.getExpenseClaims(get().filters);
            if (response.success) {
                set({ expenseClaims: response.data || [] });
            }
        } finally {
            set((state) => ({ loading: { ...state.loading, ec: false } }));
        }
    },
    fetchMaterialRequests: async () => {
        set((state) => ({ loading: { ...state.loading, mr: true } }));
        try {
            const response = await financeApi.getMaterialRequests(get().filters);
            if (response.success) {
                set({ materialRequests: response.data || [] });
            }
        } finally {
            set((state) => ({ loading: { ...state.loading, mr: false } }));
        }
    },
    setFilters: (newFilters) => {
        set((state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }));
    },
}));

export default useFinanceModuleStore;
