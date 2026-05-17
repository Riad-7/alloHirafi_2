<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AuthUserPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => AuthUserPayload::from($request->user()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'city' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'url', 'max:2048'],
            'artisan_profile.craft' => [$user->role === 'artisan' ? 'required' : 'nullable', 'string', 'max:120'],
            'artisan_profile.bio' => ['nullable', 'string'],
            'artisan_profile.hourly_rate' => ['nullable', 'numeric', 'min:0'],
            'artisan_profile.years_experience' => ['nullable', 'integer', 'min:0', 'max:80'],
            'artisan_profile.service_radius_km' => ['nullable', 'integer', 'min:0', 'max:500'],
            'artisan_profile.is_available' => ['nullable', 'boolean'],
        ]);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'city' => $data['city'] ?? null,
            'phone' => $data['phone'] ?? null,
            'avatar' => $data['avatar'] ?? null,
        ]);

        if ($user->role === 'artisan' && isset($data['artisan_profile'])) {
            $user->artisanProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'craft' => $data['artisan_profile']['craft'] ?? 'Artisan polyvalent',
                    'bio' => $data['artisan_profile']['bio'] ?? 'Disponible pour des interventions a domicile.',
                    'hourly_rate' => $data['artisan_profile']['hourly_rate'] ?? 180,
                    'years_experience' => $data['artisan_profile']['years_experience'] ?? 0,
                    'service_radius_km' => $data['artisan_profile']['service_radius_km'] ?? 20,
                    'is_available' => $data['artisan_profile']['is_available'] ?? true,
                ]
            );
        }

        return response()->json([
            'user' => AuthUserPayload::from($user->fresh()),
            'message' => 'Profil mis a jour.',
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 422);
        }

        $user->update([
            'password' => $data['password'],
        ]);

        return response()->json([
            'message' => 'Mot de passe mis a jour.',
        ]);
    }
}
