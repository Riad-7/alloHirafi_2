<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserProfileController extends Controller
{
    public function show(User $user): JsonResponse
    {
        $user->load([
            'artisanProfile.posts.images',
            'artisanProfile.reviews.client',
        ]);

        return response()->json([
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'city' => $user->city,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'artisan_profile' => $user->artisanProfile,
                'posts' => $user->artisanProfile?->posts ?? [],
                'reviews' => $user->artisanProfile?->reviews ?? [],
            ],
        ]);
    }
}
