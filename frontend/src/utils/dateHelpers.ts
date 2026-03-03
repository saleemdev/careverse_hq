/**
 * Human-friendly date formatting with dayjs
 */
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

/** Human-friendly date: "Today", "Yesterday", or "Monday, 26th February 2025" */
export function formatDateHuman(dateStr: string | undefined): string {
  if (!dateStr) return '–';
  const d = dayjs(dateStr);
  if (!d.isValid()) return '–';
  const today = dayjs().startOf('day');
  const dateOnly = d.startOf('day');
  if (dateOnly.isSame(today)) return 'Today';
  if (dateOnly.isSame(today.subtract(1, 'day'))) return 'Yesterday';
  // e.g. "Monday, 26th February 2025"
  return d.format('dddd, Do MMMM YYYY');
}

/** Relative date context: "14 days left", "Today", "7 days ago" */
export function formatDateRemaining(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  if (!d.isValid()) return '';

  const diffDays = d.startOf('day').diff(dayjs().startOf('day'), 'day');
  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
  if (diffDays === 0) return 'Today';
  const abs = Math.abs(diffDays);
  return `${abs} day${abs === 1 ? '' : 's'} ago`;
}
