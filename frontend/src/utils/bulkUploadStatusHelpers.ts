/**
 * Shared status/progress helpers for bulk upload list and detail views.
 * Keeps status colors and labels consistent.
 */

import React from 'react';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    FileTextOutlined
} from '@ant-design/icons';

export const BULK_JOB_STATUSES = ['Queued', 'Processing', 'Completed', 'Failed'] as const;

export type BulkJobStatus = (typeof BULK_JOB_STATUSES)[number];

export function getBulkJobStatusProps(status: string | undefined): {
    color: 'success' | 'processing' | 'default' | 'error';
    icon: React.ReactNode;
} {
    const s = (status ?? '').toLowerCase();
    const map: Record<string, { color: 'success' | 'processing' | 'default' | 'error'; icon: React.ReactNode }> = {
        completed: { color: 'success', icon: React.createElement(CheckCircleOutlined) },
        processing: { color: 'processing', icon: React.createElement(SyncOutlined, { spin: true }) },
        queued: { color: 'default', icon: React.createElement(ClockCircleOutlined) },
        failed: { color: 'error', icon: React.createElement(CloseCircleOutlined) }
    };
    return map[s] ?? { color: 'default', icon: React.createElement(FileTextOutlined) };
}

export function getBulkJobStatusColor(status: string | undefined): string {
    const s = (status ?? '').toLowerCase();
    switch (s) {
        case 'completed':
        case 'success':
            return 'success';
        case 'processing':
            return 'processing';
        case 'failed':
        case 'error':
            return 'error';
        case 'queued':
        case 'pending':
        default:
            return 'default';
    }
}

/**
 * Progress from list view summary (total_records, pending, etc.)
 */
export function getProgressFromSummary(job: {
    total_records?: number;
    pending?: number;
}): number {
    const total = job.total_records ?? 0;
    if (total === 0) return 0;
    const pending = job.pending ?? 0;
    const processed = total - pending;
    return Math.round((processed / total) * 100);
}

/**
 * Progress from detail view items (verification_status, onboarding_status)
 */
export function getProgressFromItems(items: Array<{ verification_status?: string; onboarding_status?: string }>): {
    percentage: number;
    processed: number;
    total: number;
} {
    if (!items?.length) return { percentage: 0, processed: 0, total: 0 };
    const total = items.length;
    const verified = items.filter((i) => i.verification_status === 'Verified').length;
    const verificationFailed = items.filter((i) => i.verification_status === 'Failed').length;
    const processed = verified + verificationFailed;
    const percentage = Math.round((processed / total) * 100);
    return { percentage, processed, total };
}
