<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Artisan;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request, Artisan $artisan): JsonResponse
    {
        $user = $request->user();
        abort_if($user->role !== 'client', 403, 'Only clients can leave reviews.');

        $data = $request->validate([
            'quote_id' => ['nullable', 'exists:quotes,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string'],
        ]);

        $review = Review::create([
            ...$data,
            'artisan_id' => $artisan->id,
            'client_id' => $user->id,
        ]);

        $artisan->update([
            'average_rating' => round((float) $artisan->reviews()->avg('rating'), 2),
        ]);

        AppNotification::create([
            'user_id' => $artisan->user_id,
            'type' => 'review',
            'title' => 'Nouvel avis',
            'body' => $user->name.' a laissé une note de '.$review->rating.'/5.',
            'payload' => ['review_id' => $review->id],
        ]);

        return response()->json([
            'review' => $review->load('client'),
            'average_rating' => $artisan->fresh()->average_rating,
        ], 201);
    }
}
