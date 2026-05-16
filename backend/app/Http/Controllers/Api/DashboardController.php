<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Conversation;
use App\Models\Post;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('artisanProfile');

        $conversationCount = Conversation::query()
            ->where('client_id', $user->id)
            ->orWhere('artisan_id', $user->id)
            ->count();

        $quotesCount = Quote::query()
            ->where('client_id', $user->id)
            ->orWhere('artisan_id', $user->id)
            ->count();

        return response()->json([
            'user' => $user,
            'stats' => [
                'artisans' => Artisan::count(),
                'posts' => Post::count(),
                'conversations' => $conversationCount,
                'quotes' => $quotesCount,
                'notifications_unread' => $user->notifications()->whereNull('read_at')->count(),
            ],
        ]);
    }
}
