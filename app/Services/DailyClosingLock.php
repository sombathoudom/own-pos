<?php

namespace App\Services;

use App\Models\DailyClosing;
use Carbon\Carbon;

class DailyClosingLock
{
    public static function isLocked(Carbon|string $date): bool
    {
        $dateString = $date instanceof Carbon ? $date->toDateString() : $date;

        return DailyClosing::where('closing_date', $dateString)
            ->where('status', 'closed')
            ->exists();
    }

    public static function ensureNotLocked(Carbon|string $date, string $message = 'This day has been closed and cannot be modified.'): void
    {
        if (self::isLocked($date)) {
            throw new \RuntimeException($message);
        }
    }
}
