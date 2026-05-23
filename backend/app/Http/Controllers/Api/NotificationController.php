<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Support\NotificationPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notificationsQuery = $request->user()->notifications();
        $notifications = $notificationsQuery->latest()->limit(40)->get();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => (clone $notificationsQuery)->whereNull('read_at')->count(),
        ]);
    }

    public function markAsRead(Request $request, AppNotification $notification): JsonResponse
    {
        abort_if($notification->user_id !== $request->user()->id, 403);

        $notification->update(['read_at' => now()]);

        $payload = NotificationPayload::from($notification->fresh());

        return response()->json([
            'notification' => $payload['notification'],
            'unread_count' => $payload['unread_count'],
        ]);
    }
}
