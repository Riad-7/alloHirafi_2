<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Artisan;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(RegisterRequest $request): Response
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($request->string('password')),
            'role' => $data['role'] ?? 'client',
            'city' => $data['city'] ?? null,
            'phone' => $data['phone'] ?? null,
        ]);

        if ($user->role === 'artisan') {
            Artisan::create([
                'user_id' => $user->id,
                'craft' => $data['craft'] ?? 'Artisan polyvalent',
                'bio' => $data['bio'] ?? 'Disponible pour des interventions a domicile.',
                'hourly_rate' => $data['hourly_rate'] ?? 180,
                'years_experience' => 2,
                'service_radius_km' => 20,
                'is_available' => true,
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        return response()->noContent();
    }
}
