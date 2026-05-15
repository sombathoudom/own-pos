/**
 * Date/Time Utility Functions
 * Ensures consistent date/time handling across the application
 * Timezone: Asia/Phnom_Penh (UTC+7)
 */

/**
 * Application timezone
 */
export const APP_TIMEZONE = 'Asia/Phnom_Penh';

/**
 * Format date for display (human-readable)
 * @param date - Date string or Date object
 * @param format - Format string (default: 'YYYY-MM-DD')
 */
export function formatDate(
    date: string | Date | null | undefined,
    format: 'short' | 'long' | 'full' = 'short',
): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    // Convert to Phnom Penh timezone
    const options: Intl.DateTimeFormatOptions = {
        timeZone: APP_TIMEZONE,
    };

    switch (format) {
        case 'short':
            // 2024-01-15
            return d.toLocaleDateString('en-CA', {
                ...options,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        case 'long':
            // Jan 15, 2024
            return d.toLocaleDateString('en-US', {
                ...options,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        case 'full':
            // Monday, January 15, 2024
            return d.toLocaleDateString('en-US', {
                ...options,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        default:
            return d.toLocaleDateString('en-CA', options);
    }
}

/**
 * Format datetime for display (human-readable)
 * @param datetime - Datetime string or Date object
 */
export function formatDateTime(
    datetime: string | Date | null | undefined,
    includeSeconds = false,
): string {
    if (!datetime) return '';

    const d = new Date(datetime);
    if (isNaN(d.getTime())) return '';

    const dateStr = formatDate(d, 'short');
    const timeStr = d.toLocaleTimeString('en-US', {
        timeZone: APP_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds && { second: '2-digit' }),
        hour12: false,
    });

    return `${dateStr} ${timeStr}`;
}

/**
 * Format time only
 * @param datetime - Datetime string or Date object
 */
export function formatTime(
    datetime: string | Date | null | undefined,
    includeSeconds = false,
): string {
    if (!datetime) return '';

    const d = new Date(datetime);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleTimeString('en-US', {
        timeZone: APP_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds && { second: '2-digit' }),
        hour12: false,
    });
}

/**
 * Get current date in YYYY-MM-DD format (for HTML input)
 */
export function getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Get current datetime in YYYY-MM-DDTHH:MM format (for HTML datetime-local input)
 */
export function getCurrentDateTime(): string {
    const now = new Date();
    const date = now.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const time = now.toLocaleTimeString('en-US', {
        timeZone: APP_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return `${date}T${time}`;
}

/**
 * Format date for HTML input (YYYY-MM-DD)
 */
export function toInputDate(date: string | Date | null | undefined): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Format datetime for HTML datetime-local input (YYYY-MM-DDTHH:MM)
 */
export function toInputDateTime(
    datetime: string | Date | null | undefined,
): string {
    if (!datetime) return '';

    const d = new Date(datetime);
    if (isNaN(d.getTime())) return '';

    const date = d.toLocaleDateString('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const time = d.toLocaleTimeString('en-US', {
        timeZone: APP_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return `${date}T${time}`;
}

/**
 * Format for reports (DD/MM/YYYY)
 */
export function formatDateForReport(
    date: string | Date | null | undefined,
): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = d
        .toLocaleDateString('en-US', {
            timeZone: APP_TIMEZONE,
            day: '2-digit',
        })
        .padStart(2, '0');
    const month = d
        .toLocaleDateString('en-US', {
            timeZone: APP_TIMEZONE,
            month: '2-digit',
        })
        .padStart(2, '0');
    const year = d.toLocaleDateString('en-US', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
    });

    return `${day}/${month}/${year}`;
}

/**
 * Format datetime for reports (DD/MM/YYYY HH:MM)
 */
export function formatDateTimeForReport(
    datetime: string | Date | null | undefined,
): string {
    if (!datetime) return '';

    const d = new Date(datetime);
    if (isNaN(d.getTime())) return '';

    const dateStr = formatDateForReport(d);
    const timeStr = d.toLocaleTimeString('en-US', {
        timeZone: APP_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `${dateStr} ${timeStr}`;
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(
    date: string | Date | null | undefined,
): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffDay < 30)
        return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
    if (diffDay < 365)
        return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`;

    return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date | null | undefined): boolean {
    if (!date) return false;

    const d = new Date(date);
    if (isNaN(d.getTime())) return false;

    const today = getCurrentDate();
    const checkDate = toInputDate(d);

    return today === checkDate;
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date | null | undefined): boolean {
    if (!date) return false;

    const d = new Date(date);
    if (isNaN(d.getTime())) return false;

    return d.getTime() < new Date().getTime();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: string | Date | null | undefined): boolean {
    if (!date) return false;

    const d = new Date(date);
    if (isNaN(d.getTime())) return false;

    return d.getTime() > new Date().getTime();
}
