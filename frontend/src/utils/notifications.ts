/**
 * Global notification utilities for user-facing error/success messages.
 *
 * Uses antd's static `notification` API so it can be called from
 * non-component code (stores, api layer, etc.) without needing a
 * React context.
 */

import { notification } from 'antd';

const PERMISSION_KEYWORDS = [
	'permission',
	'access denied',
	'not permitted',
	'not allowed',
	'forbidden',
	'403',
];

const SESSION_KEYWORDS = [
	'session',
	'authentication',
	'login',
	'unauthorized',
	'401',
];

function classify(message: string): 'permission' | 'session' | 'generic' {
	const lower = message.toLowerCase();
	if (SESSION_KEYWORDS.some((k) => lower.includes(k))) return 'session';
	if (PERMISSION_KEYWORDS.some((k) => lower.includes(k))) return 'permission';
	return 'generic';
}

/**
 * Show a warm, user-friendly error notification for an API failure.
 *
 * @param serverMessage - The error string from the backend (may be technical).
 * @param context       - Optional human-readable label for what was being done,
 *                        e.g. "loading claims" or "saving your profile".
 */
export function notifyApiError(serverMessage?: string, context?: string) {
	const msg = serverMessage || '';
	const kind = classify(msg);

	let title: string;
	let description: string;

	switch (kind) {
		case 'permission':
			title = 'Access Restricted';
			description =
				msg ||
				'You do not have the required permissions for this action. Please contact your administrator if you believe this is an error.';
			break;
		case 'session':
			title = 'Session Expired';
			description =
				'Your session has expired. Please refresh the page to sign in again.';
			break;
		default:
			title = context ? `Unable to ${context}` : 'Something went wrong';
			description =
				msg ||
				'An unexpected error occurred. Please try again or contact support if the issue persists.';
			break;
	}

	notification.error({
		message: title,
		description,
		placement: 'topRight',
		duration: 6,
	});
}

/**
 * Show a success notification.
 */
export function notifySuccess(message: string, description?: string) {
	notification.success({
		message,
		description,
		placement: 'topRight',
		duration: 4,
	});
}
