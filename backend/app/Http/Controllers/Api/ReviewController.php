<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Artisan;
use App\Models\Quote;
use App\Models\Review;
use App\Support\ArtisanRatingSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $quoteId = $data['quote_id'] ?? null;

        if ($quoteId !== null) {
            $quote = Quote::query()->findOrFail($quoteId);

            abort_if(
                $quote->client_id !== $user->id,
                403,
                'You can only review services that belong to your account.'
            );

            abort_if(
                $quote->artisan_id !== $artisan->user_id,
                422,
                'This service does not belong to the selected artisan.'
            );

            abort_if(
                $quote->status !== 'accepted',
                422,
                'You can only review accepted services.'
            );
        }

        // Quote-based reviews keep one review per service.
        // Dashboard reviews (without quote_id) can be submitted multiple times.
        $existingReview = $quoteId !== null
            ? Review::query()
                ->where('artisan_id', $artisan->id)
                ->where('client_id', $user->id)
                ->where('quote_id', $quoteId)
                ->first()
            : null;

        $review = null;
        $wasUpdated = false;

        DB::transaction(function () use ($artisan, $user, $data, $existingReview, &$review, &$wasUpdated): void {
            if ($existingReview) {
                $existingReview->update([
                    'rating' => $data['rating'],
                    'comment' => $data['comment'] ?? null,
                ]);
                $review = $existingReview->fresh();
                $wasUpdated = true;
            } else {
                $review = Review::query()->create([
                    'artisan_id' => $artisan->id,
                    'client_id' => $user->id,
                    'quote_id' => $data['quote_id'] ?? null,
                    'rating' => $data['rating'],
                    'comment' => $data['comment'] ?? null,
                ]);
            }

            $averageRating = ArtisanRatingSummary::clampRating(
                (float) Review::query()->where('artisan_id', $artisan->id)->avg('rating')
            );

            $artisan->update([
                'average_rating' => $averageRating,
            ]);

            AppNotification::create([
                'user_id' => $artisan->user_id,
                'type' => 'review',
                'title' => $wasUpdated ? 'Avis mis a jour' : 'Nouvel avis',
                'body' => $wasUpdated
                    ? $user->name.' a mis a jour sa note: '.$review->rating.'/5.'
                    : $user->name.' a laisse une note de '.$review->rating.'/5.',
                'payload' => ['review_id' => $review->id],
            ]);
        });

        $artisan->refresh()->loadMissing('user')->loadCount('reviews');
        $ratingSummary = ArtisanRatingSummary::build($artisan);

        return response()->json([
            'review' => $review->load('client'),
            'average_rating' => $artisan->average_rating,
            'rating_summary' => $ratingSummary,
        ], $wasUpdated ? 200 : 201);
    }
}
