<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanyUserController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyUserManagement($request->user(), $company);

        $company->load('users:id,name,email');
        $subscription = $company->subscriptions()->with('plan')->latest('id')->first();

        return response()->json([
            'data' => [
                'seat_limit' => $subscription?->plan?->accountant_seat_limit,
                'users' => $company->users->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                    'is_active' => (bool) $user->pivot->is_active,
                    'permissions' => $this->normalizePermissions($user->pivot->permissions),
                    'joined_at' => optional($user->pivot->joined_at)?->toIso8601String(),
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyUserManagement($request->user(), $company);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,accountant'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $this->guardAccountantSeatLimit($company, $payload['role'], (bool) ($payload['is_active'] ?? true));

        $user = DB::transaction(function () use ($company, $payload) {
            $user = User::query()->create([
                'name' => $payload['name'],
                'email' => strtolower($payload['email']),
                'password' => $payload['password'],
            ]);

            $company->users()->attach($user->id, [
                'role' => $payload['role'],
                'permissions' => $payload['permissions'] ? json_encode($payload['permissions']) : null,
                'is_active' => $payload['is_active'] ?? true,
                'joined_at' => now(),
            ]);

            return $user;
        });

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $payload['role'],
                'permissions' => $payload['permissions'] ?? null,
                'is_active' => $payload['is_active'] ?? true,
            ],
        ], 201);
    }

    public function update(Request $request, Company $company, User $user): JsonResponse
    {
        $this->ensureCompanyUserManagement($request->user(), $company);
        $membership = $this->companyMembership($user, $company);

        if (! $membership) {
            abort(404, 'User does not belong to this company.');
        }

        if ($membership->pivot->role === 'owner') {
            abort(422, 'Owner accounts cannot be reassigned here.');
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:admin,accountant'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:120'],
            'is_active' => ['required', 'boolean'],
        ]);

        $this->guardAccountantSeatLimit($company, $payload['role'], $payload['is_active'], $user->id);

        $user->update([
            'name' => $payload['name'],
            'email' => strtolower($payload['email']),
            'password' => $payload['password'] ?? $user->password,
        ]);

        $company->users()->updateExistingPivot($user->id, [
            'role' => $payload['role'],
            'permissions' => $payload['permissions'] ? json_encode($payload['permissions']) : null,
            'is_active' => $payload['is_active'],
        ]);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $payload['role'],
                'permissions' => $payload['permissions'] ?? null,
                'is_active' => $payload['is_active'],
            ],
        ]);
    }

    private function guardAccountantSeatLimit(Company $company, string $role, bool $isActive, ?int $ignoredUserId = null): void
    {
        if ($role !== 'accountant' || ! $isActive) {
            return;
        }

        $seatLimit = optional($company->subscriptions()->with('plan')->latest('id')->first()?->plan)->accountant_seat_limit;

        if ($seatLimit === null) {
            return;
        }

        $activeAccountants = $company->users()
            ->wherePivot('role', 'accountant')
            ->wherePivot('is_active', true)
            ->when($ignoredUserId, fn ($builder) => $builder->where('users.id', '!=', $ignoredUserId))
            ->count();

        if ($activeAccountants >= $seatLimit) {
            abort(422, 'This plan has reached the accountant seat limit.');
        }
    }
}