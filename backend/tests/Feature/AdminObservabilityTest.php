<?php

namespace Tests\Feature;

use App\Models\ErrorLog;
use App\Models\RequestLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminObservabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_requests_are_logged_in_request_logs_table(): void
    {
        $this->getJson('/api/localization')->assertOk();

        $this->assertDatabaseHas('request_logs', [
            'method' => 'GET',
            'path' => 'api/localization',
            'status_code' => 200,
        ]);
    }

    public function test_admin_stats_include_observability_metrics(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        RequestLog::query()->create([
            'method' => 'GET',
            'path' => 'api/test',
            'status_code' => 200,
            'duration_ms' => 12,
        ]);

        ErrorLog::query()->create([
            'method' => 'GET',
            'path' => 'api/test',
            'status_code' => 500,
            'exception_class' => \RuntimeException::class,
            'message' => 'Synthetic exception for test',
            'file' => __FILE__,
            'line' => __LINE__,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/stats');
        $response->assertOk();
        $response->assertJsonStructure([
            'total_users',
            'total_clients',
            'total_artisans',
            'pending_verifications',
            'requests_today',
            'errors_today',
            'error_rate_today',
            'errors_per_day' => [['date', 'count', 'label']],
            'recent_errors' => [[
                'id',
                'created_at',
                'method',
                'path',
                'status_code',
                'exception_class',
                'message',
            ]],
        ]);
        $response->assertJsonPath('requests_today', 1);
        $response->assertJsonPath('errors_today', 1);
    }
}
