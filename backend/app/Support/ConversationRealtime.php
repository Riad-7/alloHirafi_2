<?php

namespace App\Support;

use App\Events\UserConversationSynced;
use App\Models\Conversation;

class ConversationRealtime
{
    public static function syncParticipants(Conversation $conversation): void
    {
        $participantIds = [
            $conversation->client_id,
            $conversation->artisan_id,
        ];

        foreach ($participantIds as $participantId) {
            broadcast(new UserConversationSynced(
                $participantId,
                $conversation->id,
            ));
        }
    }
}
