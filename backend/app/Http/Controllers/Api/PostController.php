<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::query()
            ->with(['artisan.user', 'images'])
            ->when($request->string('city')->isNotEmpty(), fn ($q) => $q->where('city', $request->string('city')->value()))
            ->latest()
            ->get();

        return response()->json(['posts' => $posts]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user()->load('artisanProfile');

        abort_if($user->role !== 'artisan' || ! $user->artisanProfile, 403, 'Only artisans can create posts.');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'city' => ['required', 'string', 'max:120'],
            'price_from' => ['nullable', 'numeric', 'min:0'],
            'price_to' => ['nullable', 'numeric', 'min:0'],
            'available_at' => ['nullable', 'date'],
            'images' => ['nullable', 'array'],
            'images.*' => ['url'],
        ]);

        $post = $user->artisanProfile->posts()->create($data);

        foreach ($data['images'] ?? [] as $imageUrl) {
            $post->images()->create(['image_url' => $imageUrl]);
        }

        return response()->json([
            'post' => $post->load('images', 'artisan.user'),
        ], 201);
    }
}
