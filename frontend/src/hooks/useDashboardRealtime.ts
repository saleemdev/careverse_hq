/**
 * Dashboard Realtime Hook
 * Subscribes to dashboard metric updates via Socket.IO
 * Filters updates based on facility context and handles data merging
 */

import { useEffect, useCallback, useMemo } from 'react';
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

  // Realtime and facility stores
  const { socket, isConnected, isConnecting, connectionError, subscribe, unsubscribe } =
    useRealtimeStore();
  const { company, selectedFacilities, isAllFacilities } = useFacilityStore();

  // Get selected facility IDs for filtering
  const selectedFacilityIds = useMemo(() => selectedFacilities.map((f) => f.hie_id), [selectedFacilities]);

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

  // Handle incoming updates
  const handleDashboardUpdate = useCallback(
    (data: DashboardMetricsUpdate) => {
      console.log('[Dashboard Realtime] Received update:', data);

      // Filter out irrelevant updates
      if (!isUpdateRelevant(data)) {
        console.log('[Dashboard Realtime] Update not relevant to current facility context, ignoring');
        return;
      }

      // Dispatch updates to specific handlers
      if (data.approval_metrics && onApprovalUpdate) {
        console.log('[Dashboard Realtime] Applying approval metrics update');
        onApprovalUpdate(data.approval_metrics);
      }

      if (data.budget_metrics && onBudgetUpdate) {
        console.log('[Dashboard Realtime] Applying budget metrics update');
        onBudgetUpdate(data.budget_metrics);
      }

      if (data.attendance_metrics && onAttendanceUpdate) {
        console.log('[Dashboard Realtime] Applying attendance metrics update');
        onAttendanceUpdate(data.attendance_metrics);
      }

      if (data.company_metrics && onCompanyUpdate) {
        console.log('[Dashboard Realtime] Applying company metrics update');
        onCompanyUpdate(data.company_metrics);
      }
    },
    [isUpdateRelevant, onApprovalUpdate, onBudgetUpdate, onAttendanceUpdate, onCompanyUpdate]
  );

  // Handle approval-specific updates
  const handleApprovalUpdate = useCallback(
    (data: any) => {
      console.log('[Dashboard Realtime] Received approval update:', data);

      if (!isUpdateRelevant({ ...data, company })) {
        return;
      }

      if (onApprovalUpdate) {
        onApprovalUpdate(data);
      }
    },
    [isUpdateRelevant, company, onApprovalUpdate]
  );

  // Handle budget-specific updates
  const handleBudgetUpdate = useCallback(
    (data: any) => {
      console.log('[Dashboard Realtime] Received budget update:', data);

      if (!isUpdateRelevant({ ...data, company })) {
        return;
      }

      if (onBudgetUpdate) {
        onBudgetUpdate(data);
      }
    },
    [isUpdateRelevant, company, onBudgetUpdate]
  );

  // Handle attendance-specific updates
  const handleAttendanceUpdate = useCallback(
    (data: any) => {
      console.log('[Dashboard Realtime] Received attendance update:', data);

      if (!isUpdateRelevant({ ...data, company })) {
        return;
      }

      if (onAttendanceUpdate) {
        onAttendanceUpdate(data);
      }
    },
    [isUpdateRelevant, company, onAttendanceUpdate]
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

  // Log connection status changes
  useEffect(() => {
    if (isConnected) {
      console.log('[Dashboard Realtime] Socket connected');
    } else if (connectionError) {
      console.warn('[Dashboard Realtime] Connection error:', connectionError);
      if (onError) {
        onError(connectionError);
      }
    }
  }, [isConnected, connectionError, onError]);

  return {
    isConnected,
    isConnecting,
    connectionError,
  };
};

export default useDashboardRealtime;
