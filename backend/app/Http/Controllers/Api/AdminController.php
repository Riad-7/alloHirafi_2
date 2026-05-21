<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    /**
     * Admin dashboard statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'total_users' => User::count(),
            'total_clients' => User::where('role', 'client')->count(),
            'total_artisans' => Artisan::count(),
            'pending_verifications' => VerificationRequest::where('status', 'pending')->count(),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $role = $request->input('role');

        $users = User::query()
            ->with('artisanProfile')
            ->when(in_array($role, ['client', 'artisan', 'admin'], true), fn ($query) => $query->where('role', $role))
            ->latest()
            ->get(['id', 'name', 'email', 'role', 'city', 'phone', 'avatar', 'created_at']);

        return response()->json(['users' => $users]);
    }

    /**
     * List verification requests with optional status filter.
     */
    public function verifications(Request $request): JsonResponse
    {
        $query = VerificationRequest::with(['user', 'reviewer'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->latest();

        return response()->json($query->get());
    }

    /**
     * Securely serve a verification document (admin only).
     */
    public function showDocument(VerificationRequest $verification): StreamedResponse|JsonResponse
    {
        $path = $verification->document_path;

        if (! Storage::disk('local')->exists($path)) {
            return response()->json([
                'message' => 'Document introuvable.',
            ], 404);
        }

        $mimeType = Storage::disk('local')->mimeType($path);

        return Storage::disk('local')->response($path, null, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline',
        ]);
    }

    /**
     * Approve a verification request.
     */
    public function approve(Request $request, VerificationRequest $verification): JsonResponse
    {
        if ($verification->status !== 'pending') {
            return response()->json([
                'message' => 'Cette demande a deja ete traitee.',
            ], 422);
        }

        $verification->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->input('admin_notes'),
        ]);

        // Set the artisan as verified
        $artisan = Artisan::where('user_id', $verification->user_id)->first();
        if ($artisan) {
            $artisan->update(['is_verified' => true]);
        }

        // Notify the artisan
        \App\Models\AppNotification::create([
            'user_id' => $verification->user_id,
            'type' => 'verification_approved',
            'title' => 'Compte verifie !',
            'body' => 'Felicitation, votre demande de verification a ete approuvee. Vous avez maintenant le badge de verification.',
            'payload' => ['verification_id' => $verification->id],
        ]);

        return response()->json([
            'message' => 'Artisan verifie avec succes.',
            'verification' => $verification->fresh(['user', 'reviewer']),
        ]);
    }

    /**
     * Reject a verification request.
     */
    public function reject(Request $request, VerificationRequest $verification): JsonResponse
    {
        if ($verification->status !== 'pending') {
            return response()->json([
                'message' => 'Cette demande a deja ete traitee.',
            ], 422);
        }

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $verification->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'admin_notes' => $data['note'] ?? null,
        ]);

        // Notify the artisan
        \App\Models\AppNotification::create([
            'user_id' => $verification->user_id,
            'type' => 'verification_rejected',
            'title' => 'Demande de verification refusee',
            'body' => 'Votre demande de verification a ete refusee. Veuillez consulter les notes de l\'administrateur pour plus d\'informations.',
            'payload' => [
                'verification_id' => $verification->id,
                'reason' => $data['note'] ?? null
            ],
        ]);

        return response()->json([
            'message' => 'Demande rejetee.',
            'verification' => $verification->fresh(['user', 'reviewer']),
        ]);
    }
}
