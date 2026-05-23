<?php

namespace App\Observers;

use App\Events\UserNotificationSynced;
use App\Models\AppNotification;
use App\Support\NotificationPayload;

class AppNotificationObserver
{
    public function created(AppNotification $notification): void
    {
        $this->broadcast($notification->fresh());
    }

    public function updated(AppNotification $notification): void
    {
        if ($notification->wasChanged(['read_at', 'title', 'body', 'payload', 'type'])) {
            $this->broadcast($notification->fresh());
        }
    }

    private function broadcast(?AppNotification $notification): void
    {
        if (! $notification) {
            return;
        }

        $payload = NotificationPayload::from($notification);

        broadcast(new UserNotificationSynced(
            $notification->user_id,
            $payload['notification'],
            $payload['unread_count'],
        ));
    }
}
