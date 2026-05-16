<?php

namespace App\Services;

class AiSearchInterpreter
{
    private const CITIES = [
        'casablanca', 'rabat', 'marrakech', 'agadir', 'fes', 'meknes',
        'tanger', 'tetouan', 'oujda', 'kenitra', 'el jadida',
    ];

    private const CRAFTS = [
        'plombier', 'electricien', 'électricien', 'menuisier', 'maçon',
        'macon', 'peintre', 'climatisation', 'serrurier', 'carreleur',
    ];

    public function interpret(string $prompt): array
    {
        $normalized = mb_strtolower(trim($prompt));

        $city = $this->match(self::CITIES, $normalized);
        $craft = $this->match(self::CRAFTS, $normalized);

        return [
            'metier' => $craft,
            'ville' => $city ? ucfirst($city) : null,
            'sort' => str_contains($normalized, 'pas cher') || str_contains($normalized, 'cheap') ? 'tarif_asc' : null,
            'disponible' => str_contains($normalized, 'disponible') || str_contains($normalized, 'today'),
        ];
    }

    private function match(array $choices, string $prompt): ?string
    {
        foreach ($choices as $choice) {
            if (str_contains($prompt, $choice)) {
                return $choice;
            }
        }

        return null;
    }
}
