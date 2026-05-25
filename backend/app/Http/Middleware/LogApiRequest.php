<?php

namespace App\Http\Middleware;

use App\Models\RequestLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class LogApiRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = microtime(true);
        $statusCode = 500;

        try {
            $response = $next($request);
            $statusCode = $response->getStatusCode();

            return $response;
        } catch (Throwable $throwable) {
            throw $throwable;
        } finally {
            try {
                RequestLog::query()->create([
                    'user_id' => $request->user()?->id,
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'status_code' => $statusCode,
                    'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                    'ip_address' => $request->ip(),
                    'user_agent' => mb_substr((string) $request->userAgent(), 0, 1024),
                ]);
            } catch (Throwable) {
                // Observability should never interrupt the request lifecycle.
            }
        }
    }
}
