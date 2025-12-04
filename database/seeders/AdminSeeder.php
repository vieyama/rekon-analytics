<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insert a single user with type 0
        DB::table('users')->insert([
            'name' => 'Superadmin', // You can change this to any name you prefer
            'email' => 'superadmin@s2p.com', // Change to a unique email
            'password' => Hash::make('qwerty123'), // Set a password
            'gender' => 'male', // Set the user type to 0
            'type' => 1, // Set the user type to 0
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
