<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtisanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Artisan::query()
            ->with(['user', 'posts.images', 'reviews.client'])
            ->when($request->string('metier')->isNotEmpty(), fn ($q) => $q->where('craft', 'like', '%'.$request->string('metier')->value().'%'))
            ->when($request->string('ville')->isNotEmpty(), fn ($q) => $q->whereHas('user', fn ($user) => $user->where('city', $request->string('ville')->value())))
            ->when($request->boolean('disponible'), fn ($q) => $q->where('is_available', true))
            ->when($request->filled('note'), fn ($q) => $q->where('average_rating', '>=', (float) $request->input('note')));

        if ($request->input('sort') === 'tarif_asc') {
            $query->orderBy('hourly_rate');
        } elseif ($request->input('sort') === 'rating_desc') {
            $query->orderByDesc('average_rating');
        } else {
            $query->latest();
        }

        return response()->json([
            'artisans' => $query->get(),
        ]);
    }

    public function show(Artisan $artisan): JsonResponse
    {
        return response()->json([
            'artisan' => $artisan->load(['user', 'posts.images', 'reviews.client']),
        ]);
    }
}
