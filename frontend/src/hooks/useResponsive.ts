/**
 * Responsive Hook for HealthPro ERP Dashboard
 * Detects screen size and provides responsive utilities
 */

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../styles/tokens';

interface ResponsiveValue<T = number | string> {
    mobile: T;
    tablet: T;
    desktop: T;
}

interface ResponsiveState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    width: number;
    height: number;
    breakpoint: 'mobile' | 'tablet' | 'desktop';
}

interface ResponsiveHook extends ResponsiveState {
    getResponsiveValue: <T>(values: Partial<ResponsiveValue<T>>) => T;
    is: (breakpoint: 'mobile' | 'tablet' | 'desktop') => boolean;
    isAtLeast: (breakpoint: 'mobile' | 'tablet' | 'desktop') => boolean;
}

export const useResponsive = (): ResponsiveHook => {
    const [state, setState] = useState<ResponsiveState>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
        breakpoint: 'desktop',
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            const isMobile = width < BREAKPOINTS.mobile;
            const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
            const isDesktop = width >= BREAKPOINTS.tablet;

            setState({
                isMobile,
                isTablet,
                isDesktop,
                width,
                height,
                breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
            });
        };

        // Initial check
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getResponsiveValue = <T,>(values: Partial<ResponsiveValue<T>>): T => {
        if (state.isMobile && values.mobile !== undefined) return values.mobile;
        if (state.isTablet && values.tablet !== undefined) return values.tablet;
        return values.desktop!;
    };

    const is = (breakpoint: 'mobile' | 'tablet' | 'desktop') => state.breakpoint === breakpoint;

    const isAtLeast = (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
        const order = { mobile: 0, tablet: 1, desktop: 2 };
        return order[state.breakpoint] >= order[breakpoint];
    };

    return {
        ...state,
        getResponsiveValue,
        is,
        isAtLeast,
    };
};

export default useResponsive;
