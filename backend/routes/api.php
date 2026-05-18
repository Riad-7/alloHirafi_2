<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\{AdminController, ArtisanController, ConversationController, DashboardController, NotificationController, PostController, ProfileController, QuoteController, ReviewController, SearchController, VerificationController};
use App\Support\AuthUserPayload;

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
    Route::post('/profile/verify', [VerificationController::class, 'store']);

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

    // Admin routes
    Route::middleware(['admin'])->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/verifications/pending', function (Request $request) {
            $request->merge(['status' => 'pending']);
            return app(AdminController::class)->verifications($request);
        });
        Route::get('/verifications', [AdminController::class, 'verifications']);
        Route::get('/verifications/{verification}/document', [AdminController::class, 'showDocument']);
        Route::post('/verifications/{verification}/approve', [AdminController::class, 'approve']);
        Route::post('/verifications/{verification}/reject', [AdminController::class, 'reject']);
    });
});
