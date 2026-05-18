<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\VerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtisanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Artisan::query()
            ->with(['user', 'posts.images', 'reviews.client'])
            ->when($request->string('metier')->isNotEmpty(), fn ($q) => $q->where('craft', 'like', '%'.$request->string('metier')->value().'%'))
            ->when($request->string('ville')->isNotEmpty(), fn ($q) => $q->whereHas('user', fn ($user) => $user->where('city', $request->string('ville')->value())))
            ->when($request->boolean('disponible'), fn ($q) => $q->where('is_available', true))
            ->when($request->filled('note'), fn ($q) => $q->where('average_rating', '>=', (float) $request->input('note')));

        if ($request->input('sort') === 'tarif_asc') {
            $query->orderBy('hourly_rate');
        } elseif ($request->input('sort') === 'rating_desc') {
            $query->orderByDesc('average_rating');
        } else {
            $query->latest();
        }

        return response()->json([
            'artisans' => $query->get(),
        ]);
    }

    public function show(Artisan $artisan): JsonResponse
    {
        return response()->json([
            'artisan' => $artisan->load(['user', 'posts.images', 'reviews.client']),
        ]);
    }

    public function requestVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        // Validate
        $request->validate([
            'document_type' => 'required|in:cin,diploma',
            'document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        // Check if user already has a pending verification request
        $existingRequest = VerificationRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'You already have a pending verification request.',
            ], 422);
        }

        // Store file
        $path = $request->file('document')->store('verifications', 'local');

        // Create record
        VerificationRequest::create([
            'user_id' => $user->id,
            'document_type' => $request->document_type,
            'document_path' => $path,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Verification request submitted successfully.',
        ]);
    }
}
