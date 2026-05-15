<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateTimeHelper
{
    /**
     * Get the application timezone
     */
    public static function appTimezone(): string
    {
        return config('app.timezone', 'Asia/Phnom_Penh');
    }

    /**
     * Format date for display (human-readable)
     */
    public static function formatDate(?Carbon $date, string $format = 'Y-m-d'): ?string
    {
        return $date?->timezone(self::appTimezone())->format($format);
    }

    /**
     * Format datetime for display (human-readable)
     */
    public static function formatDateTime(?Carbon $datetime, string $format = 'Y-m-d H:i:s'): ?string
    {
        return $datetime?->timezone(self::appTimezone())->format($format);
    }

    /**
     * Format date for database storage (always in app timezone)
     */
    public static function toDatabase(?string $date): ?string
    {
        if (! $date) {
            return null;
        }

        return Carbon::parse($date, self::appTimezone())->format('Y-m-d');
    }

    /**
     * Format datetime for database storage (always in app timezone)
     */
    public static function toDateTimeDatabase(?string $datetime): ?string
    {
        if (! $datetime) {
            return null;
        }

        return Carbon::parse($datetime, self::appTimezone())->format('Y-m-d H:i:s');
    }

    /**
     * Get current date in app timezone
     */
    public static function now(): Carbon
    {
        return Carbon::now(self::appTimezone());
    }

    /**
     * Get current date (date only) in app timezone
     */
    public static function today(): Carbon
    {
        return Carbon::today(self::appTimezone());
    }

    /**
     * Parse date string to Carbon instance in app timezone
     */
    public static function parse(?string $date): ?Carbon
    {
        if (! $date) {
            return null;
        }

        return Carbon::parse($date, self::appTimezone());
    }

    /**
     * Get date for HTML input (YYYY-MM-DD format)
     */
    public static function forInput(?Carbon $date): ?string
    {
        return $date?->timezone(self::appTimezone())->format('Y-m-d');
    }

    /**
     * Get datetime for HTML input (YYYY-MM-DDTHH:MM format)
     */
    public static function forDateTimeInput(?Carbon $datetime): ?string
    {
        return $datetime?->timezone(self::appTimezone())->format('Y-m-d\TH:i');
    }

    /**
     * Format for reports (localized format)
     */
    public static function forReport(?Carbon $date, string $format = 'd/m/Y'): ?string
    {
        return $date?->timezone(self::appTimezone())->format($format);
    }

    /**
     * Format datetime for reports (localized format)
     */
    public static function forReportDateTime(?Carbon $datetime, string $format = 'd/m/Y H:i'): ?string
    {
        return $datetime?->timezone(self::appTimezone())->format($format);
    }
}
