<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Services\AiSearchInterpreter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private readonly AiSearchInterpreter $interpreter)
    {
    }

    public function search(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:500'],
        ]);

        $filters = $this->interpreter->interpret($data['prompt']);

        $query = Artisan::query()->with(['user', 'posts.images']);

        if ($filters['metier']) {
            $query->where('craft', 'like', '%'.$filters['metier'].'%');
        }

        if ($filters['ville']) {
            $query->whereHas('user', fn ($user) => $user->where('city', $filters['ville']));
        }

        if ($filters['disponible']) {
            $query->where('is_available', true);
        }

        if ($filters['sort'] === 'tarif_asc') {
            $query->orderBy('hourly_rate');
        }

        return response()->json([
            'filters' => $filters,
            'artisans' => $query->get(),
        ]);
    }
}
