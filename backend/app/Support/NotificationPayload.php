<?php

namespace App\Support;

use App\Models\AppNotification;

class NotificationPayload
{
    /**
     * @return array{notification: array<string, mixed>, unread_count: int}
     */
    public static function from(AppNotification $notification): array
    {
        return [
            'notification' => $notification->toArray(),
            'unread_count' => AppNotification::query()
                ->where('user_id', $notification->user_id)
                ->whereNull('read_at')
                ->count(),
        ];
    }
}
