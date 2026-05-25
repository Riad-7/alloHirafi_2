<?php

namespace App\Support;

use App\Models\Artisan;

class ArtisanRatingSummary
{
    public static function build(Artisan $artisan): array
    {
        $reviewsCount = self::resolveReviewsCount($artisan);
        $averageRating = self::clampRating((float) ($artisan->average_rating ?? 0));
        $formattedAverage = self::formatAverage($averageRating);
        $starsVisual = self::starsVisual($averageRating);
        $noReviewsMessage = $reviewsCount === 0 ? 'Aucune evaluation pour le moment' : null;

        return [
            'artisan_name' => $artisan->user?->name ?? ('Artisan #'.$artisan->id),
            'average_rating' => $averageRating,
            'reviews_count' => $reviewsCount,
            'stars_visual' => $starsVisual,
            'display' => $reviewsCount === 0
                ? $noReviewsMessage
                : $starsVisual.' ('.$formattedAverage.'/5)',
            'no_reviews_message' => $noReviewsMessage,
        ];
    }

    public static function clampRating(float $rating): float
    {
        return max(0.0, min(5.0, round($rating, 2)));
    }

    private static function resolveReviewsCount(Artisan $artisan): int
    {
        if (array_key_exists('reviews_count', $artisan->getAttributes())) {
            return (int) $artisan->getAttribute('reviews_count');
        }

        return $artisan->relationLoaded('reviews')
            ? $artisan->reviews->count()
            : $artisan->reviews()->count();
    }

    private static function formatAverage(float $rating): string
    {
        $formatted = rtrim(rtrim(number_format($rating, 2, '.', ''), '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }

    private static function starsVisual(float $rating): string
    {
        $filledStars = (int) floor(self::clampRating($rating));

        return str_repeat('⭐', $filledStars).str_repeat('☆', 5 - $filledStars);
    }
}
