<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportAccountController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.support_users.manage');

        return response()->json([
            'data' => User::query()
                ->whereIn('platform_role', ['support', 'super_admin'])
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'platform_role', 'support_permissions', 'is_platform_active']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.support_users.manage');

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'platform_role' => ['required', 'in:support,super_admin'],
            'is_platform_active' => ['required', 'boolean'],
            'support_permissions' => ['nullable', 'array'],
            'support_permissions.*' => ['string', 'max:120'],
        ]);

        $user = User::query()->create([
            'name' => $payload['name'],
            'email' => strtolower($payload['email']),
            'password' => $payload['password'],
            'platform_role' => $payload['platform_role'],
            'support_permissions' => $payload['support_permissions'] ?? null,
            'is_platform_active' => $payload['is_platform_active'],
        ]);

        return response()->json(['data' => $user], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensurePlatformAbility($request->user(), 'platform.support_users.manage');

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string', 'min:8'],
            'platform_role' => ['required', 'in:support,super_admin'],
            'is_platform_active' => ['required', 'boolean'],
            'support_permissions' => ['nullable', 'array'],
            'support_permissions.*' => ['string', 'max:120'],
        ]);

        $user->update([
            'name' => $payload['name'],
            'email' => strtolower($payload['email']),
            'platform_role' => $payload['platform_role'],
            'support_permissions' => $payload['support_permissions'] ?? null,
            'is_platform_active' => $payload['is_platform_active'],
            'password' => $payload['password'] ?? $user->password,
        ]);

        return response()->json(['data' => $user->fresh()]);
    }
}