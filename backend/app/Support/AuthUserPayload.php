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
        $user->loadMissing(['artisanProfile', 'verificationRequests']);

        $latestVerificationRequest = $user->verificationRequests->last();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'city' => $user->city,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'artisan_profile' => $user->artisanProfile,
            'is_verified' => $user->artisanProfile?->is_verified ?? false,
            'verification_status' => $latestVerificationRequest?->status,
            'rejection_note' => $latestVerificationRequest?->admin_notes,
        ];
    }
}
