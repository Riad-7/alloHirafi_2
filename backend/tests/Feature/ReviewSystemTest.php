<?php

namespace Tests\Feature;

use App\Models\Artisan;
use App\Models\Quote;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_create_a_review_and_receive_a_structured_rating_summary(): void
    {
        [$artisan, $client] = $this->createArtisanAndClient();

        Sanctum::actingAs($client);

        $response = $this->postJson("/api/artisans/{$artisan->id}/reviews", [
            'rating' => 5,
            'comment' => 'Excellent service.',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('rating_summary.artisan_name', $artisan->user->name);
        $response->assertJsonPath('rating_summary.reviews_count', 1);
        $response->assertJsonPath('rating_summary.stars_visual', str_repeat("\u{2B50}", 5));
        $response->assertJsonPath('rating_summary.display', str_repeat("\u{2B50}", 5).' (5/5)');

        $this->assertDatabaseHas('reviews', [
            'artisan_id' => $artisan->id,
            'client_id' => $client->id,
            'rating' => 5,
        ]);

        $artisan->refresh();
        $this->assertSame(5.0, (float) $artisan->average_rating);
    }

    public function test_client_can_submit_multiple_dashboard_reviews_for_the_same_artisan(): void
    {
        [$artisan, $client] = $this->createArtisanAndClient();

        Sanctum::actingAs($client);

        $first = $this->postJson("/api/artisans/{$artisan->id}/reviews", [
            'rating' => 5,
            'comment' => 'Tres bien',
        ]);
        $first->assertCreated();

        $second = $this->postJson("/api/artisans/{$artisan->id}/reviews", [
            'rating' => 3,
            'comment' => 'Deuxieme avis',
        ]);
        $second->assertCreated();

        $this->assertSame(2, Review::query()->where('artisan_id', $artisan->id)->count());

        $artisan->refresh();
        $this->assertSame(4.0, (float) $artisan->average_rating);
    }

    public function test_quote_based_review_is_updated_when_same_service_is_reviewed_again(): void
    {
        [$artisan, $client, $artisanUser] = $this->createArtisanAndClient(withArtisanUser: true);

        $quote = Quote::create([
            'artisan_id' => $artisanUser->id,
            'client_id' => $client->id,
            'title' => 'Plomberie',
            'description' => 'Reparation fuite',
            'amount' => 450,
            'status' => 'accepted',
        ]);

        Sanctum::actingAs($client);

        $firstReviewResponse = $this->postJson("/api/artisans/{$artisan->id}/reviews", [
            'quote_id' => $quote->id,
            'rating' => 4,
            'comment' => 'Bon travail',
        ]);
        $firstReviewResponse->assertCreated();

        $secondReviewResponse = $this->postJson("/api/artisans/{$artisan->id}/reviews", [
            'quote_id' => $quote->id,
            'rating' => 2,
            'comment' => 'Mise a jour du meme service',
        ]);
        $secondReviewResponse->assertOk();

        $this->assertSame(1, Review::count());
        $this->assertDatabaseHas('reviews', [
            'quote_id' => $quote->id,
            'rating' => 2,
        ]);
    }

    public function test_quote_based_review_requires_accepted_service(): void
    {
        [$artisan, $client, $artisanUser] = $this->createArtisanAndClient(withArtisanUser: true);

        $quote = Quote::create([
            'artisan_id' => $artisanUser->id,
            'client_id' => $client->id,
            'title' => 'Electricite',
            'description' => 'Maintenance',
            'amount' => 300,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($client);

        $response = $this->postJson("/api/artisans/{$artisan->id}/reviews", [
            'quote_id' => $quote->id,
            'rating' => 5,
        ]);

        $response->assertStatus(422);
        $this->assertSame(0, Review::count());
    }

    private function createArtisanAndClient(bool $withArtisanUser = false): array
    {
        $artisanUser = User::factory()->create([
            'role' => 'artisan',
            'name' => 'Artisan Test',
        ]);

        $artisan = Artisan::create([
            'user_id' => $artisanUser->id,
            'craft' => 'Plombier',
            'average_rating' => 0,
        ]);

        $client = User::factory()->create([
            'role' => 'client',
            'name' => 'Client Test',
        ]);

        if ($withArtisanUser) {
            return [$artisan, $client, $artisanUser];
        }

        return [$artisan, $client];
    }
}
