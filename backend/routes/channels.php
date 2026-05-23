<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('users.{id}.conversations', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('users.{id}.notifications', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversations.{conversationId}', function ($user, $conversationId) {
    return \App\Models\Conversation::query()
        ->whereKey($conversationId)
        ->where(function ($query) use ($user) {
            $query
                ->where('client_id', $user->id)
                ->orWhere('artisan_id', $user->id);
        })
        ->exists();
});
