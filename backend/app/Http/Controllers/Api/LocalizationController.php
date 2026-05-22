<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class LocalizationController extends Controller
{
    public function show(Request $request): array
    {
        $locale = App::currentLocale();

        return [
            'locale' => $locale,
            'fallback_locale' => config('app.fallback_locale'),
            'direction' => $locale === 'ar' ? 'rtl' : 'ltr',
            'messages' => $this->readMessages($locale),
            'available_locales' => ['fr', 'ar'],
        ];
    }

    public function update(Request $request): array
    {
        $validated = $request->validate([
            'locale' => ['required', 'in:fr,ar'],
        ]);

        $locale = $validated['locale'];
        App::setLocale($locale);
        cookie()->queue(cookie('locale', $locale, 60 * 24 * 365));

        return [
            'locale' => $locale,
            'direction' => $locale === 'ar' ? 'rtl' : 'ltr',
            'messages' => $this->readMessages($locale),
            'available_locales' => ['fr', 'ar'],
        ];
    }

    private function readMessages(string $locale): array
    {
        $path = lang_path($locale.'.json');

        if (!is_file($path)) {
            return [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? $decoded : [];
    }
}
