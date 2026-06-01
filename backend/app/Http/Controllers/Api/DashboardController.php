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

        $conversationQuery = Conversation::query();
        $quoteQuery = Quote::query();

        if ($user->role === 'client') {
            $conversationQuery->where('client_id', $user->id);
            $quoteQuery->where('client_id', $user->id);
        } elseif ($user->role === 'artisan') {
            $conversationQuery->where('artisan_id', $user->id);
            $quoteQuery->where('artisan_id', $user->id);
        } else {
            $conversationQuery
                ->where('client_id', $user->id)
                ->orWhere('artisan_id', $user->id);

            $quoteQuery
                ->where('client_id', $user->id)
                ->orWhere('artisan_id', $user->id);
        }

        $conversationCount = $conversationQuery->count();
        $quotesCount = $quoteQuery->count();

        $stats = [
            'conversations' => $conversationCount,
            'quotes' => $quotesCount,
            'notifications_unread' => $user->notifications()->whereNull('read_at')->count(),
        ];

        if ($user->role === 'artisan') {
            $stats['posts'] = $user->artisanProfile ? $user->artisanProfile->posts()->count() : 0;
            $stats['rating'] = $user->artisanProfile ? floatval($user->artisanProfile->average_rating ?? 0.0) : 0.0;
            $stats['reviews_count'] = $user->artisanProfile ? $user->artisanProfile->reviews()->count() : 0;
        } elseif ($user->role === 'admin') {
            $stats['artisans'] = Artisan::count();
            $stats['posts'] = Post::count();
        }

        return response()->json([
            'user' => $user,
            'stats' => $stats,
        ]);
    }
}
