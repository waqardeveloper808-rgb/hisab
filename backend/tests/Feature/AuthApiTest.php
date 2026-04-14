<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_through_api(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Amina Rahman',
            'email' => 'amina@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Amina Rahman')
            ->assertJsonPath('data.email', 'amina@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'amina@example.com',
        ]);
    }

    public function test_user_can_log_in_through_api(): void
    {
        $user = User::factory()->create([
            'email' => 'amina@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'amina@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'amina@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}