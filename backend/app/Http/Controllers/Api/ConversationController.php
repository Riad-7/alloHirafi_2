<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->with(['client', 'artisan', 'messages.sender', 'quotes'])
            ->where(fn ($query) => $query
                ->where('client_id', $user->id)
                ->orWhere('artisan_id', $user->id))
            ->orderByDesc('last_message_at')
            ->get();

        return response()->json(['conversations' => $conversations]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'artisan_id' => ['required', 'exists:users,id'],
            'message' => ['nullable', 'string'],
        ]);

        $client = $request->user();
        $artisan = User::findOrFail($data['artisan_id']);

        abort_if($client->role !== 'client', 403, 'Only clients can start a conversation.');
        abort_if($artisan->role !== 'artisan', 422, 'Selected user is not an artisan.');

        $conversation = Conversation::firstOrCreate([
            'client_id' => $client->id,
            'artisan_id' => $artisan->id,
        ]);

        if (! empty($data['message'])) {
            $conversation->messages()->create([
                'sender_id' => $client->id,
                'body' => $data['message'],
            ]);

            $conversation->update(['last_message_at' => now()]);

            AppNotification::create([
                'user_id' => $artisan->id,
                'type' => 'message',
                'title' => 'Nouveau message',
                'body' => $client->name.' vous a contacte.',
                'payload' => ['conversation_id' => $conversation->id],
            ]);
        }

        return response()->json([
            'conversation' => $conversation->load(['client', 'artisan', 'messages.sender', 'quotes']),
        ], 201);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_if(! in_array($user->id, [$conversation->client_id, $conversation->artisan_id], true), 403);

        $data = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => $user->id,
            'body' => $data['body'],
        ]);

        $conversation->update(['last_message_at' => now()]);

        $recipientId = $conversation->client_id === $user->id ? $conversation->artisan_id : $conversation->client_id;
        AppNotification::create([
            'user_id' => $recipientId,
            'type' => 'message',
            'title' => 'Nouveau message',
            'body' => $user->name.' vous a repondu.',
            'payload' => ['conversation_id' => $conversation->id],
        ]);

        return response()->json([
            'message' => $message->load('sender'),
        ], 201);
    }
}
