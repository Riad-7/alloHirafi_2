<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\LogApiRequest::class,
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'setLocale' => \App\Http\Middleware\SetLocale::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Throwable $throwable): void {
            if (app()->runningUnitTests()) {
                return;
            }

            $statusCode = $throwable instanceof HttpExceptionInterface
                ? $throwable->getStatusCode()
                : 500;

            if ($statusCode < 500) {
                return;
            }

            try {
                $request = request();

                \App\Models\ErrorLog::query()->create([
                    'user_id' => $request?->user()?->id,
                    'method' => $request?->method(),
                    'path' => $request?->path(),
                    'status_code' => $statusCode,
                    'exception_class' => $throwable::class,
                    'message' => mb_substr($throwable->getMessage(), 0, 3000),
                    'file' => mb_substr($throwable->getFile(), 0, 1024),
                    'line' => $throwable->getLine(),
                    'ip_address' => $request?->ip(),
                    'user_agent' => mb_substr((string) $request?->userAgent(), 0, 1024),
                    'trace' => mb_substr($throwable->getTraceAsString(), 0, 20000),
                ]);
            } catch (\Throwable) {
                // Never block the main exception flow if observability persistence fails.
            }
        });
    })->create();
