import type { ReactNode } from 'react';

/**
 * Get KEPHL level badge configuration
 */
export const getKephlLevelBadge = (level: string | null | undefined): { color: string; text: string } => {
    if (!level) {
        return { color: 'default', text: 'N/A' };
    }

    const levelUpper = level.toUpperCase();

    switch (levelUpper) {
        case 'L6':
        case 'LEVEL 6':
            return { color: '#722ed1', text: 'Level 6' };
        case 'L5':
        case 'LEVEL 5':
            return { color: '#1890ff', text: 'Level 5' };
        case 'L4':
        case 'LEVEL 4':
            return { color: '#13c2c2', text: 'Level 4' };
        case 'L3':
        case 'LEVEL 3':
            return { color: '#52c41a', text: 'Level 3' };
        case 'L2':
        case 'LEVEL 2':
            return { color: '#faad14', text: 'Level 2' };
        case 'L1':
        case 'LEVEL 1':
            return { color: '#fa8c16', text: 'Level 1' };
        default:
            return { color: '#52c41a', text: level };
    }
};

/**
 * Format facility ID for display
 */
export const formatFacilityId = (id: string | null | undefined): string => {
    if (!id) return 'N/A';
    return id;
};

/**
 * Format boolean values for display with tags
 */
export const formatYesNo = (value: any): { status: 'success' | 'error'; text: string; iconType: 'check' | 'close' } => {
    const isTrue = value === 1 || value === true || value === '1' || value === 'Yes';

    return {
        status: isTrue ? 'success' : 'error',
        text: isTrue ? 'Yes' : 'No',
        iconType: isTrue ? 'check' : 'close'
    };
};

/**
 * Format phone number for display
 */
export const formatPhone = (phone: string | null | undefined): { value: string; href?: string } => {
    if (!phone) return { value: 'N/A' };
    return { value: phone, href: `tel:${phone}` };
};

/**
 * Format email for display
 */
export const formatEmail = (email: string | null | undefined): { value: string; href?: string } => {
    if (!email) return { value: 'N/A' };
    return { value: email, href: `mailto:${email}` };
};

/**
 * Format website for display
 */
export const formatWebsite = (website: string | null | undefined): { value: string; href?: string } => {
    if (!website) return { value: 'N/A' };

    // Ensure the URL has a protocol
    const url = website.startsWith('http://') || website.startsWith('https://')
        ? website
        : `https://${website}`;

    return { value: website, href: url };
};

/**
 * Format field value or return N/A
 */
export const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
        return 'N/A';
    }
    return String(value);
};

/**
 * Calculate bed utilization percentage
 */
export const calculateBedUtilization = (
    currentOccupancy: number | null | undefined,
    totalCapacity: number | null | undefined
): string => {
    if (!currentOccupancy || !totalCapacity || totalCapacity === 0) {
        return 'N/A';
    }

    const percentage = (currentOccupancy / totalCapacity) * 100;
    return `${percentage.toFixed(1)}%`;
};
