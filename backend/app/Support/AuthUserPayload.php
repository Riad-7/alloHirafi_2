<?php

namespace App\Support;

use App\Models\User;

class AuthUserPayload
{
    /**
     * Build a consistent user payload for SPA auth endpoints.
     *
     * @return array<string, mixed>
     */
    public static function from(User $user): array
    {
        $user->loadMissing('artisanProfile');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'city' => $user->city,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'artisan_profile' => $user->artisanProfile,
        ];
    }
}
