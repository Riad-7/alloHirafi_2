<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuoteController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->role !== 'artisan', 403, 'Only artisans can create quotes.');

        $data = $request->validate([
            'conversation_id' => ['nullable', 'exists:conversations,id'],
            'client_id' => ['required', 'exists:users,id'],
            'post_id' => ['nullable', 'exists:posts,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:1'],
        ]);

        $quote = Quote::create([
            ...$data,
            'artisan_id' => $user->id,
        ]);

        AppNotification::create([
            'user_id' => $quote->client_id,
            'type' => 'quote',
            'title' => 'Nouveau devis',
            'body' => $user->name.' a envoye un devis.',
            'payload' => ['quote_id' => $quote->id],
        ]);

        return response()->json([
            'quote' => $quote->load(['artisanUser', 'client', 'post']),
        ], 201);
    }

    public function updateStatus(Request $request, Quote $quote): JsonResponse
    {
        $user = $request->user();
        abort_if($user->id !== $quote->client_id, 403, 'Only the client can update this quote.');

        $data = $request->validate([
            'status' => ['required', Rule::in(['accepted', 'rejected'])],
        ]);

        $quote->update($data);

        AppNotification::create([
            'user_id' => $quote->artisan_id,
            'type' => 'quote_status',
            'title' => 'Mise a jour devis',
            'body' => 'Votre devis a ete '.$data['status'].'.',
            'payload' => ['quote_id' => $quote->id, 'status' => $data['status']],
        ]);

        return response()->json([
            'quote' => $quote->fresh()->load(['artisanUser', 'client', 'post']),
        ]);
    }
}


