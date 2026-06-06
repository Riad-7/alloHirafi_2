<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Services\ArtisanMatchCandidate;
use App\Services\AiSearchInterpreter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private readonly AiSearchInterpreter $interpreter)
    {
    }

    public function search(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:500'],
        ]);

        $availableCrafts = Artisan::query()
            ->select('craft')
            ->distinct()
            ->pluck('craft')
            ->filter()
            ->values()
            ->all();

        $availableCities = Artisan::query()
            ->join('users', 'users.id', '=', 'artisans.user_id')
            ->select('users.city')
            ->distinct()
            ->pluck('city')
            ->filter()
            ->values()
            ->all();

        $filters = $this->interpreter->interpret($data['prompt'], $availableCrafts, $availableCities);

        $artisans = Artisan::query()
            ->with(['user', 'posts.images', 'reviews.client'])
            ->get()
            ->map(function (Artisan $artisan) use ($filters): Artisan {
                [$score, $reasons] = $this->interpreter->score(new ArtisanMatchCandidate(
                    craft: $artisan->craft,
                    bio: $artisan->bio,
                    city: $artisan->user?->city,
                    postsText: $artisan->posts
                        ->map(fn ($post) => implode(' ', [$post->title, $post->description, $post->city]))
                        ->implode(' '),
                    isAvailable: (bool) $artisan->is_available,
                    hourlyRate: $artisan->hourly_rate !== null ? (float) $artisan->hourly_rate : null,
                    averageRating: (float) $artisan->average_rating,
                    isVerified: (bool) ($artisan->is_verified ?? false),
                ), $filters);

                $artisan->setAttribute('match_score', $score);
                $artisan->setAttribute('match_reasons', $reasons);

                return $artisan;
            });

        $matched = $artisans
            ->filter(fn (Artisan $artisan) => $artisan->getAttribute('match_score') > 0);

        if ($matched->isEmpty()) {
            $matched = $artisans;
        }

        $matched = $matched
            ->sortByDesc(fn (Artisan $artisan) => $artisan->getAttribute('match_score'))
            ->values();

        if (($filters['sort'] ?? null) === 'tarif_asc') {
            $matched = $matched->sortBy(fn (Artisan $artisan) => $artisan->hourly_rate ?? PHP_INT_MAX)->values();
        }

        return response()->json([
            'filters' => $filters,
            'artisans' => $matched,
        ]);
    }
}
