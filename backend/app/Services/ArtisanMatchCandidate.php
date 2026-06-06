<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
class ArtisanMatchCandidate
{
    public function __construct(
        public readonly string $craft,
        public readonly ?string $bio,
        public readonly ?string $city,
        public readonly string $postsText,
        public readonly bool $isAvailable,
        public readonly ?float $hourlyRate,
        public readonly float $averageRating,
        public readonly bool $isVerified,
    ) {
    }
}
