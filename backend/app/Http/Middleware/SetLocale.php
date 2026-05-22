<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * @var string[]
     */
    private array $supportedLocales = ['fr', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);

        App::setLocale($locale);

        $response = $next($request);
        $response->headers->set('Content-Language', $locale);

        if ($request->cookie('locale') !== $locale) {
            cookie()->queue(cookie('locale', $locale, 60 * 24 * 365));
        }

        return $response;
    }

    private function resolveLocale(Request $request): string
    {
        $requested = $request->query('locale')
            ?? $request->header('X-Locale')
            ?? $request->cookie('locale')
            ?? config('app.locale');

        return in_array($requested, $this->supportedLocales, true)
            ? $requested
            : config('app.fallback_locale', 'fr');
    }
}
