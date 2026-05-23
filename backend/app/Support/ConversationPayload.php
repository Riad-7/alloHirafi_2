<?php

namespace App\Support;

use App\Models\Conversation;
use App\Models\User;

class ConversationPayload
{
    /**
     * Build the inbox payload for all conversations visible to a user.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function listForUser(User $user): array
    {
        return Conversation::query()
            ->with(['client', 'artisan', 'messages.sender', 'quotes'])
            ->where(fn ($query) => $query
                ->where('client_id', $user->id)
                ->orWhere('artisan_id', $user->id))
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Conversation $conversation) => self::hydrate($conversation, $user->id))
            ->all();
    }

    /**
     * Build the inbox payload for one conversation relative to a user.
     *
     * @return array<string, mixed>
     */
    public static function oneForUser(Conversation|int $conversation, User|int $user): array
    {
        $conversationId = $conversation instanceof Conversation ? $conversation->id : $conversation;
        $userId = $user instanceof User ? $user->id : $user;

        $loadedConversation = Conversation::query()
            ->with(['client', 'artisan', 'messages.sender', 'quotes'])
            ->findOrFail($conversationId);

        return self::hydrate($loadedConversation, $userId);
    }

    /**
     * @return array<string, mixed>
     */
    private static function hydrate(Conversation $conversation, int $userId): array
    {
        $conversation->setAttribute(
            'unread_messages_count',
            $conversation->messages()
                ->whereNull('read_at')
                ->where('sender_id', '!=', $userId)
                ->count(),
        );

        return $conversation->toArray();
    }
}
