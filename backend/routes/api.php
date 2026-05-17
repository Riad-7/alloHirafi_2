<?php

use App\Http\Controllers\Api\ArtisanController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SearchController;
use App\Support\AuthUserPayload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/artisans', [ArtisanController::class, 'index']);
Route::get('/artisans/{artisan}', [ArtisanController::class, 'show']);
Route::get('/posts', [PostController::class, 'index']);
Route::post('/search/ai', [SearchController::class, 'search']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request): array {
        return ['user' => AuthUserPayload::from($request->user())];
    });

    // Keep legacy /me for compatibility with existing clients.
    Route::get('/me', function (Request $request): array {
        return ['user' => AuthUserPayload::from($request->user())];
    });

    Route::get('/dashboard', [DashboardController::class, 'show']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword']);

    Route::post('/posts', [PostController::class, 'store']);

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);
    Route::patch('/conversations/{conversation}/read', [ConversationController::class, 'markAsRead']);

    Route::post('/quotes', [QuoteController::class, 'store']);
    Route::patch('/quotes/{quote}/status', [QuoteController::class, 'updateStatus']);

    Route::post('/artisans/{artisan}/reviews', [ReviewController::class, 'store']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
});
