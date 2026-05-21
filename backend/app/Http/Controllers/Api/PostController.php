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
            ->when($request->user()?->artisanProfile && $request->boolean('mine'), fn ($q) => $q->where('artisan_id', $request->user()->artisanProfile->id))
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
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
        ]);

        $post = $user->artisanProfile->posts()->create([
            'title' => $data['title'],
            'description' => $data['description'],
            'city' => $data['city'],
            'price_from' => $data['price_from'] ?? null,
            'price_to' => $data['price_to'] ?? null,
            'available_at' => $data['available_at'] ?? null,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $request->getSchemeAndHttpHost() . '/storage/' . $image->store('posts', 'public');
                $post->images()->create(['image_url' => $path]);
            }
        }

        return response()->json([
            'post' => $post->load('images', 'artisan.user'),
        ], 201);
    }
}
