<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use App\Support\AccessMatrix;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'platform_role',
        'support_permissions',
        'is_platform_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'support_permissions' => 'array',
            'is_platform_active' => 'boolean',
        ];
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class)
            ->withPivot(['role', 'permissions', 'is_active', 'joined_at'])
            ->withTimestamps();
    }

    public function agentProfile(): HasOne
    {
        return $this->hasOne(Agent::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class, 'created_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(AgentReferral::class, 'referred_user_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->platform_role === 'super_admin' && $this->is_platform_active;
    }

    public function isSupportAccount(): bool
    {
        return $this->platform_role === 'support' && $this->is_platform_active;
    }

    public function platformAbilities(): array
    {
        return AccessMatrix::platformAbilitiesFor($this->platform_role, $this->support_permissions);
    }

    public function hasPlatformAbility(string $ability): bool
    {
        return AccessMatrix::hasAbility($this->platformAbilities(), $ability);
    }
}
