<?php

namespace Database\Seeders;

use App\Models\AppNotification;
use App\Models\Artisan;
use App\Models\Conversation;
use App\Models\Post;
use App\Models\Quote;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        AppNotification::query()->delete();
        Review::query()->delete();
        Quote::query()->delete();
        Conversation::query()->delete();
        Post::query()->delete();
        Artisan::query()->delete();
        User::query()->delete();

        $client = User::create([
            'name' => 'Sara El Idrissi',
            'email' => 'client@alohirafi.ma',
            'password' => 'password',
            'role' => 'client',
            'city' => 'Agadir',
            'phone' => '0600000001',
        ]);

        $artisanOneUser = User::create([
            'name' => 'Youssef Bensalem',
            'email' => 'artisan1@alohirafi.ma',
            'password' => 'password',
            'role' => 'artisan',
            'city' => 'Agadir',
            'phone' => '0600000002',
        ]);

        $artisanTwoUser = User::create([
            'name' => 'Nadia Amrani',
            'email' => 'artisan2@alohirafi.ma',
            'password' => 'password',
            'role' => 'artisan',
            'city' => 'Marrakech',
            'phone' => '0600000003',
        ]);

        $artisanOne = Artisan::create([
            'user_id' => $artisanOneUser->id,
            'craft' => 'Plombier',
            'bio' => 'Interventions rapides pour fuites, chauffe-eau et installations sanitaires.',
            'hourly_rate' => 180,
            'years_experience' => 6,
            'service_radius_km' => 25,
            'is_available' => true,
            'average_rating' => 4.8,
        ]);

        $artisanTwo = Artisan::create([
            'user_id' => $artisanTwoUser->id,
            'craft' => 'Electricien',
            'bio' => 'Depannage, mise aux normes et installation complete pour maison et commerce.',
            'hourly_rate' => 220,
            'years_experience' => 9,
            'service_radius_km' => 30,
            'is_available' => true,
            'average_rating' => 4.6,
        ]);

        $postOne = Post::create([
            'artisan_id' => $artisanOne->id,
            'title' => 'Plomberie express 7j/7',
            'description' => 'Reparation fuite, debouchage et remplacement robinetterie a Agadir.',
            'city' => 'Agadir',
            'price_from' => 120,
            'price_to' => 350,
            'available_at' => now()->addDay(),
        ]);

        $postOne->images()->createMany([
            ['image_url' => 'https://images.unsplash.com/photo-1621905252472-e8fbd57f9282?auto=format&fit=crop&w=900&q=80'],
            ['image_url' => 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80'],
        ]);

        $postTwo = Post::create([
            'artisan_id' => $artisanTwo->id,
            'title' => 'Electricite maison et boutique',
            'description' => 'Diagnostic, tableaux electriques, luminaires et maintenance preventive.',
            'city' => 'Marrakech',
            'price_from' => 180,
            'price_to' => 500,
            'available_at' => now()->addDays(2),
        ]);

        $postTwo->images()->create([
            'image_url' => 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
        ]);

        $conversation = Conversation::create([
            'client_id' => $client->id,
            'artisan_id' => $artisanOneUser->id,
            'last_message_at' => now()->subHour(),
        ]);

        $conversation->messages()->createMany([
            [
                'sender_id' => $client->id,
                'body' => 'Salam, 3andi fuite f la cuisine. Wach t9dar tji lyoum?',
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
            [
                'sender_id' => $artisanOneUser->id,
                'body' => 'Salam, iya n9dar nji m3a 17h. Ghadi n3tik devis melli nchouf lmochkil.',
                'created_at' => now()->subHour(),
                'updated_at' => now()->subHour(),
            ],
        ]);

        $quote = Quote::create([
            'conversation_id' => $conversation->id,
            'artisan_id' => $artisanOneUser->id,
            'client_id' => $client->id,
            'post_id' => $postOne->id,
            'title' => 'Reparation fuite cuisine',
            'description' => 'Main d oeuvre + changement joint et verification pression.',
            'amount' => 260,
            'status' => 'pending',
        ]);

        Review::create([
            'artisan_id' => $artisanOne->id,
            'client_id' => $client->id,
            'quote_id' => $quote->id,
            'rating' => 5,
            'comment' => 'Professionnel, ponctuel et clair dans le prix.',
        ]);

        collect([
            [
                'user_id' => $client->id,
                'type' => 'quote',
                'title' => 'Nouveau devis recu',
                'body' => 'Youssef Bensalem vous a envoye un devis.',
                'payload' => ['quote_id' => $quote->id],
            ],
            [
                'user_id' => $artisanOneUser->id,
                'type' => 'review',
                'title' => 'Nouvel avis',
                'body' => 'Sara El Idrissi a laisse un avis 5/5.',
                'payload' => ['artisan_id' => $artisanOne->id],
            ],
        ])->each(fn (array $notification) => AppNotification::create($notification));
    }
}
