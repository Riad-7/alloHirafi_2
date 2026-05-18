<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    /**
     * Submit a verification document (artisan only).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'artisan') {
            return response()->json([
                'message' => 'Seuls les artisans peuvent soumettre une demande de verification.',
            ], 403);
        }

        // Check if there's already a pending request
        $existing = VerificationRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Vous avez deja une demande de verification en attente.',
            ], 422);
        }

        $data = $request->validate([
            'document_type' => ['required', 'in:cin,diploma'],
            'document' => ['required', 'file', 'mimes:jpeg,jpg,png,pdf', 'max:5120'], // 5MB max
        ]);

        // Store in private disk (not publicly accessible)
        $path = $request->file('document')->store('verifications', 'local');

        $verification = VerificationRequest::create([
            'user_id' => $user->id,
            'document_type' => $data['document_type'],
            'document_path' => $path,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Document soumis avec succes. Votre demande est en cours de revision.',
            'verification' => $verification,
        ], 201);
    }

    /**
     * Get the current verification status for the authenticated artisan.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        $latest = VerificationRequest::where('user_id', $user->id)
            ->latest()
            ->first();

        $isVerified = false;
        if ($user->role === 'artisan' && $user->artisanProfile) {
            $isVerified = (bool) $user->artisanProfile->is_verified;
        }

        return response()->json([
            'is_verified' => $isVerified,
            'latest_request' => $latest,
        ]);
    }
}
