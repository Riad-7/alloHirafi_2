<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@allohirafi.com'],
            [
                'name' => 'Admin AlloHirafi',
                'password' => Hash::make('admin1234'),
                'role' => 'admin',
                'city' => 'Casablanca',
                'avatar' => 'https://ui-avatars.com/api/?name=Admin&background=0d1b2a&color=ffffff&size=256',
            ]
        );
    }
}
