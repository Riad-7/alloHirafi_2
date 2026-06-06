<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiSearchInterpreter
{
    private const CITY_ALIASES = [
        'Casablanca' => ['casablanca', 'casa', 'dar bida', 'dar lbeda', 'الدار البيضاء', 'كازا'],
        'Rabat' => ['rabat', 'ribat', 'رباط', 'الرباط'],
        'Marrakech' => ['marrakech', 'marakech', 'kech', 'مراكش'],
        'Agadir' => ['agadir', 'agadir', 'اكادير', 'أكادير'],
        'Fes' => ['fes', 'fez', 'فاس'],
        'Meknes' => ['meknes', 'مكناس'],
        'Tanger' => ['tanger', 'tangier', 'طنجة'],
        'Tetouan' => ['tetouan', 'تطوان'],
        'Oujda' => ['oujda', 'وجدة'],
        'Kenitra' => ['kenitra', 'القنيطرة'],
        'El Jadida' => ['el jadida', 'jadida', 'الجديدة'],
    ];

    private const CRAFT_ALIASES = [
        'Plombier' => ['plombier', 'plomberie', 'sanitaire', 'fuite', 'robinet', 'tuyau', 'chauffe-eau', 'lma', 'الماء', 'سباك'],
        'Electricien' => ['electricien', 'electricite', 'electrician', 'elektrik', 'trician', 'courant', 'prise', 'lampe', 'ضو', 'كهرباء', 'كهربائي'],
        'Menuisier' => ['menuisier', 'menuiserie', 'bois', 'porte', 'placard', 'نجار', 'خشب'],
        'Macon' => ['macon', 'maçon', 'construction', 'mur', 'beton', 'brique', 'بناء', 'بناي'],
        'Peintre' => ['peintre', 'peinture', 'paint', 'صباغة', 'صباغ'],
        'Jardinier' => ['jardinier', 'jardin', 'garden', 'gazon', 'حديقة', 'جردة'],
        'Serrurier' => ['serrurier', 'serrure', 'cle', 'clé', 'porte bloquee', 'قفل', 'مفتاح'],
        'Climatisation' => ['climatisation', 'clim', 'climatiseur', 'ac', 'مكيف', 'كليم'],
        'Carreleur' => ['carreleur', 'carrelage', 'zellij', 'زليج'],
        'Nettoyage' => ['nettoyage', 'menage', 'cleaning', 'نظافة', 'تنظيف'],
    ];

    public function interpret(string $prompt, array $availableCrafts = [], array $availableCities = []): array
    {
        $fallback = $this->fallbackInterpret($prompt, $availableCrafts, $availableCities);

        if (! config('services.openai.key')) {
            return $fallback;
        }

        try {
            $ai = $this->interpretWithOpenAi($prompt, $availableCrafts, $availableCities);

            return array_merge($fallback, array_filter($ai, fn ($value) => $value !== null && $value !== []));
        } catch (\Throwable) {
            return $fallback;
        }
    }

    public function score(ArtisanMatchCandidate $candidate, array $intent): array
    {
        $score = 0;
        $reasons = [];
        $haystack = $this->normalize(implode(' ', [
            $candidate->craft,
            $candidate->bio,
            $candidate->city,
            $candidate->postsText,
        ]));

        if ($intent['metier']) {
            $craftScore = $this->textMatchesCraft($haystack, $intent['metier']) ? 70 : 0;
            $score += $craftScore;
            if ($craftScore > 0) {
                $reasons[] = "metier: {$intent['metier']}";
            }
        }

        if ($intent['ville']) {
            $cityScore = $candidate->city && $this->normalize($candidate->city) === $this->normalize($intent['ville']) ? 30 : 0;
            $score += $cityScore;
            if ($cityScore > 0) {
                $reasons[] = "ville: {$intent['ville']}";
            }
        }

        foreach ($intent['keywords'] ?? [] as $keyword) {
            if (Str::contains($haystack, $this->normalize($keyword))) {
                $score += 6;
            }
        }

        if ($intent['disponible'] && $candidate->isAvailable) {
            $score += 12;
            $reasons[] = 'disponible';
        }

        if (($intent['sort'] ?? null) === 'tarif_asc' && $candidate->hourlyRate !== null) {
            $score += max(0, 20 - min(20, (int) $candidate->hourlyRate / 10));
            $reasons[] = 'tarif adapte';
        }

        $score += min(10, (float) $candidate->averageRating * 2);

        if ($candidate->isVerified) {
            $score += 5;
        }

        return [min(100, (int) round($score)), array_values(array_unique($reasons))];
    }

    private function interpretWithOpenAi(string $prompt, array $availableCrafts, array $availableCities): array
    {
        $response = Http::withToken(config('services.openai.key'))
            ->timeout(12)
            ->acceptJson()
            ->post('https://api.openai.com/v1/responses', [
                'model' => config('services.openai.search_model'),
                'input' => [
                    [
                        'role' => 'system',
                        'content' => 'Tu analyses une recherche client pour trouver un artisan au Maroc. Comprends darija, arabe, francais, anglais et fautes. Retourne uniquement les champs du schema.',
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'prompt' => $prompt,
                            'available_crafts' => $availableCrafts,
                            'available_cities' => $availableCities,
                        ], JSON_UNESCAPED_UNICODE),
                    ],
                ],
                'text' => [
                    'format' => [
                        'type' => 'json_schema',
                        'name' => 'artisan_search_intent',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'additionalProperties' => false,
                            'properties' => [
                                'metier' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
                                'ville' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
                                'keywords' => ['type' => 'array', 'items' => ['type' => 'string']],
                                'sort' => ['anyOf' => [['type' => 'string', 'enum' => ['best_match', 'tarif_asc', 'rating_desc']], ['type' => 'null']]],
                                'disponible' => ['type' => 'boolean'],
                                'confidence' => ['type' => 'number'],
                            ],
                            'required' => ['metier', 'ville', 'keywords', 'sort', 'disponible', 'confidence'],
                        ],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            return [];
        }

        $content = data_get($response->json(), 'output.0.content.0.text')
            ?? data_get($response->json(), 'output_text');

        if (! is_string($content)) {
            return [];
        }

        $data = json_decode($content, true);

        if (! is_array($data)) {
            return [];
        }

        return [
            'metier' => $this->canonicalCraft($data['metier'] ?? null, $availableCrafts),
            'ville' => $this->canonicalCity($data['ville'] ?? null, $availableCities),
            'keywords' => array_slice(array_filter($data['keywords'] ?? [], 'is_string'), 0, 8),
            'sort' => ($data['sort'] ?? null) === 'tarif_asc' ? 'tarif_asc' : (($data['sort'] ?? null) === 'rating_desc' ? 'rating_desc' : null),
            'disponible' => (bool) ($data['disponible'] ?? false),
            'source' => 'openai',
        ];
    }

    private function fallbackInterpret(string $prompt, array $availableCrafts, array $availableCities): array
    {
        $normalized = $this->normalize($prompt);

        return [
            'metier' => $this->detectCraft($normalized, $availableCrafts),
            'ville' => $this->detectCity($normalized, $availableCities),
            'keywords' => $this->keywords($normalized),
            'sort' => Str::contains($normalized, ['pas cher', 'rkhis', 'rkhisa', 'cheap', 'economique', 'رخيص']) ? 'tarif_asc' : null,
            'disponible' => Str::contains($normalized, ['disponible', 'urgent', 'urgence', 'daba', 'db', 'today', 'اليوم', 'دابا', 'مستعجل']),
            'source' => 'local',
        ];
    }

    private function detectCraft(string $prompt, array $availableCrafts): ?string
    {
        foreach (self::CRAFT_ALIASES as $craft => $aliases) {
            if (Str::contains($prompt, array_map(fn ($alias) => $this->normalize($alias), $aliases))) {
                return $this->canonicalCraft($craft, $availableCrafts);
            }
        }

        return $this->canonicalCraft($prompt, $availableCrafts);
    }

    private function detectCity(string $prompt, array $availableCities): ?string
    {
        foreach (self::CITY_ALIASES as $city => $aliases) {
            if (Str::contains($prompt, array_map(fn ($alias) => $this->normalize($alias), $aliases))) {
                return $this->canonicalCity($city, $availableCities);
            }
        }

        return $this->canonicalCity($prompt, $availableCities);
    }

    private function canonicalCraft(?string $value, array $availableCrafts): ?string
    {
        return $this->canonicalFromList($value, $availableCrafts ?: array_keys(self::CRAFT_ALIASES));
    }

    private function canonicalCity(?string $value, array $availableCities): ?string
    {
        return $this->canonicalFromList($value, $availableCities ?: array_keys(self::CITY_ALIASES));
    }

    private function canonicalFromList(?string $value, array $choices): ?string
    {
        if (! $value) {
            return null;
        }

        $normalizedValue = $this->normalize($value);

        foreach ($choices as $choice) {
            if (Str::contains($normalizedValue, $this->normalize($choice)) || Str::contains($this->normalize($choice), $normalizedValue)) {
                return $choice;
            }
        }

        return null;
    }

    private function textMatchesCraft(string $haystack, string $craft): bool
    {
        $aliases = self::CRAFT_ALIASES[$craft] ?? [$craft];

        return Str::contains($haystack, array_map(fn ($alias) => $this->normalize($alias), $aliases));
    }

    private function keywords(string $prompt): array
    {
        $stopWords = ['ana', 'bghit', 'baghi', 'chi', 'wach', 'ila', 'svp', 'pour', 'avec', 'dans', 'f', 'fi', 'li', 'dyal', 'dial', 'من', 'في', 'على'];

        return collect(preg_split('/\s+/u', $prompt) ?: [])
            ->map(fn ($word) => trim($word, " \t\n\r\0\x0B.,;:!?()[]{}'\""))
            ->filter(fn ($word) => mb_strlen($word) > 2 && ! in_array($word, $stopWords, true))
            ->unique()
            ->take(8)
            ->values()
            ->all();
    }

    private function normalize(string $value): string
    {
        $value = mb_strtolower($value);
        $value = strtr($value, [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ä' => 'a',
            'ç' => 'c',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ñ' => 'n',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'ö' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
        ]);

        return preg_replace('/\s+/u', ' ', trim($value)) ?: '';
    }
}
