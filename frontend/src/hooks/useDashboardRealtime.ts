/**
 * Dashboard Realtime Hook
 * Subscribes to dashboard metric updates via Socket.IO
 * Filters updates based on facility context and handles data merging
 */

import { useEffect, useCallback, useRef } from 'react';
import useRealtimeStore from '../stores/realtimeStore';
import useFacilityStore from '../stores/facilityStore';

export interface DashboardMetricsUpdate {
  company?: string;
  facilities?: string[]; // facility IDs that this update applies to
  approval_metrics?: {
    purchase_orders?: {
      pending?: number;
      total_value?: number;
    };
    expense_claims?: {
      pending?: number;
      total_value?: number;
    };
    material_requests?: {
      pending?: number;
      total_value?: number;
    };
  };
  budget_metrics?: {
    total_budget?: number;
    utilized?: number;
    remaining?: number;
    utilization_percent?: number;
  };
  attendance_metrics?: {
    present_count?: number;
    absent_count?: number;
    late_arrivals?: number;
    check_in_rate?: number;
  };
  company_metrics?: {
    total_employees?: number;
    pending_affiliations?: number;
    total_departments?: number;
    total_facilities?: number;
  };
  timestamp?: string;
}

interface UseDashboardRealtimeOptions {
  onApprovalUpdate?: (data: DashboardMetricsUpdate['approval_metrics']) => void;
  onBudgetUpdate?: (data: DashboardMetricsUpdate['budget_metrics']) => void;
  onAttendanceUpdate?: (data: DashboardMetricsUpdate['attendance_metrics']) => void;
  onCompanyUpdate?: (data: DashboardMetricsUpdate['company_metrics']) => void;
  onError?: (error: string) => void;
  enabled?: boolean; // Allow disabling realtime
}

/**
 * Hook to subscribe to dashboard realtime updates
 * Automatically handles subscription/unsubscription and facility filtering
 */
export const useDashboardRealtime = (
  options: UseDashboardRealtimeOptions = {}
): {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  lastUpdate?: DashboardMetricsUpdate;
} => {
  const { onApprovalUpdate, onBudgetUpdate, onAttendanceUpdate, onCompanyUpdate, onError, enabled = true } =
    options;

  // Realtime and facility stores (single source of truth: getSelectedFacilityIds)
  const { socket, isConnected, isConnecting, connectionError, subscribe, subscribeConnectionError } =
    useRealtimeStore();
  const company = useFacilityStore((s) => s.company);
  const isAllFacilities = useFacilityStore((s) => s.isAllFacilities);
  const selectedFacilityIds = useFacilityStore((s) => s.getSelectedFacilityIds());

  // Check if update is relevant to current facility context
  const isUpdateRelevant = useCallback(
    (update: DashboardMetricsUpdate): boolean => {
      // Check company match
      if (update.company && company?.name && update.company !== company.name) {
        return false;
      }

      // If "All Facilities" mode, accept all updates for this company
      if (isAllFacilities()) {
        return true;
      }

      // If specific facilities selected, check if update applies to any of them
      if (update.facilities && update.facilities.length > 0) {
        const hasRelevantFacility = update.facilities.some((facilityId) =>
          selectedFacilityIds.includes(facilityId)
        );
        return hasRelevantFacility;
      }

      // If no facilities specified in update, it's for all facilities
      return true;
    },
    [company?.name, selectedFacilityIds, isAllFacilities]
  );

  // Safe invoke: never let a callback throw and break the hook
  const safeInvoke = useCallback(<T>(fn: ((arg: T) => void) | undefined, arg: T) => {
    try {
      fn?.(arg);
    } catch (err) {
      console.error('[Dashboard Realtime] Handler callback threw:', err);
    }
  }, []);

  // Handle incoming updates
  const handleDashboardUpdate = useCallback(
    (data: DashboardMetricsUpdate) => {
      try {
        console.log('[Dashboard Realtime] Received update:', data);
        if (!isUpdateRelevant(data)) {
          console.log('[Dashboard Realtime] Update not relevant to current facility context, ignoring');
          return;
        }
        if (data.approval_metrics && onApprovalUpdate) {
          safeInvoke(onApprovalUpdate, data.approval_metrics);
        }
        if (data.budget_metrics && onBudgetUpdate) {
          safeInvoke(onBudgetUpdate, data.budget_metrics);
        }
        if (data.attendance_metrics && onAttendanceUpdate) {
          safeInvoke(onAttendanceUpdate, data.attendance_metrics);
        }
        if (data.company_metrics && onCompanyUpdate) {
          safeInvoke(onCompanyUpdate, data.company_metrics);
        }
      } catch (err) {
        console.error('[Dashboard Realtime] handleDashboardUpdate error:', err);
      }
    },
    [isUpdateRelevant, onApprovalUpdate, onBudgetUpdate, onAttendanceUpdate, onCompanyUpdate, safeInvoke]
  );

  // Handle approval-specific updates
  const handleApprovalUpdate = useCallback(
    (data: any) => {
      try {
        if (!isUpdateRelevant({ ...data, company })) return;
        safeInvoke(onApprovalUpdate, data);
      } catch (err) {
        console.error('[Dashboard Realtime] handleApprovalUpdate error:', err);
      }
    },
    [isUpdateRelevant, company, onApprovalUpdate, safeInvoke]
  );

  // Handle budget-specific updates
  const handleBudgetUpdate = useCallback(
    (data: any) => {
      try {
        if (!isUpdateRelevant({ ...data, company })) return;
        safeInvoke(onBudgetUpdate, data);
      } catch (err) {
        console.error('[Dashboard Realtime] handleBudgetUpdate error:', err);
      }
    },
    [isUpdateRelevant, company, onBudgetUpdate, safeInvoke]
  );

  // Handle attendance-specific updates
  const handleAttendanceUpdate = useCallback(
    (data: any) => {
      try {
        if (!isUpdateRelevant({ ...data, company })) return;
        safeInvoke(onAttendanceUpdate, data);
      } catch (err) {
        console.error('[Dashboard Realtime] handleAttendanceUpdate error:', err);
      }
    },
    [isUpdateRelevant, company, onAttendanceUpdate, safeInvoke]
  );

  // Subscribe to realtime events on mount (if enabled)
  useEffect(() => {
    if (!enabled || !socket) {
      console.log('[Dashboard Realtime] Hook disabled or socket not ready');
      return;
    }

    console.log('[Dashboard Realtime] Subscribing to dashboard events...');

    // Subscribe to different event types
    const unsubscribeUpdate = subscribe('dashboard_metrics_update', handleDashboardUpdate);
    const unsubscribeApproval = subscribe('dashboard_approval_update', handleApprovalUpdate);
    const unsubscribeBudget = subscribe('dashboard_budget_update', handleBudgetUpdate);
    const unsubscribeAttendance = subscribe('dashboard_attendance_update', handleAttendanceUpdate);

    return () => {
      console.log('[Dashboard Realtime] Unsubscribing from dashboard events...');
      unsubscribeUpdate();
      unsubscribeApproval();
      unsubscribeBudget();
      unsubscribeAttendance();
    };
  }, [enabled, socket, subscribe, handleDashboardUpdate, handleApprovalUpdate, handleBudgetUpdate, handleAttendanceUpdate]);

  // Event-driven: store notifies on connection error; register once, ref always has latest onError (no useEffect on connectionError)
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  useEffect(() => {
    if (!enabled) return;
    const unsubscribeError = subscribeConnectionError((error) => {
      try {
        onErrorRef.current?.(error);
      } catch (err) {
        console.error('[Dashboard Realtime] onError callback threw:', err);
      }
    });
    return () => unsubscribeError();
  }, [enabled, subscribeConnectionError]);

  return {
    isConnected,
    isConnecting,
    connectionError,
  };
};

export default useDashboardRealtime;
