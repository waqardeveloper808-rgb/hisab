<?php

namespace App\Support;

class AccessMatrix
{
    private const COMPANY_DEFAULTS = [
        'owner' => ['*'],
        'admin' => [
            'company.settings.manage',
            'company.users.manage',
            'company.subscription.view',
            'company.referral.view',
            'workspace.contacts.manage',
            'workspace.items.manage',
            'workspace.sales.manage',
            'workspace.purchases.manage',
            'workspace.payments.manage',
            'workspace.reports.view',
            'workspace.accounting.view',
            'workspace.vat.view',
            'workspace.help.view',
            'workspace.agents.view',
        ],
        'accountant' => [
            'workspace.contacts.manage',
            'workspace.items.manage',
            'workspace.sales.manage',
            'workspace.purchases.manage',
            'workspace.payments.manage',
            'workspace.reports.view',
            'workspace.accounting.view',
            'workspace.vat.view',
            'workspace.help.view',
        ],
    ];

    private const PLATFORM_DEFAULTS = [
        'super_admin' => ['*'],
        'support' => [
            'platform.plans.view',
            'platform.agents.view',
            'platform.customers.view',
            'platform.customers.manage',
            'platform.subscriptions.view',
            'company.users.manage',
        ],
    ];

    public static function platformAbilitiesFor(?string $role, mixed $permissions = null): array
    {
        if (! $role || ! array_key_exists($role, self::PLATFORM_DEFAULTS)) {
            return [];
        }

        return self::resolveAbilities(self::PLATFORM_DEFAULTS[$role], $permissions);
    }

    public static function companyAbilitiesFor(?string $role, mixed $permissions = null): array
    {
        if (! $role || ! array_key_exists($role, self::COMPANY_DEFAULTS)) {
            return [];
        }

        return self::resolveAbilities(self::COMPANY_DEFAULTS[$role], $permissions);
    }

    public static function hasAbility(array $abilities, string $ability): bool
    {
        return in_array('*', $abilities, true) || in_array($ability, $abilities, true);
    }

    public static function normalizePermissions(mixed $permissions): ?array
    {
        if ($permissions === null) {
            return null;
        }

        if (is_string($permissions)) {
            $decoded = json_decode($permissions, true);
            return is_array($decoded) ? array_values(array_unique($decoded)) : null;
        }

        if (is_array($permissions)) {
            return array_values(array_unique(array_filter($permissions, static fn ($value) => is_string($value) && $value !== '')));
        }

        return null;
    }

    private static function resolveAbilities(array $defaults, mixed $permissions): array
    {
        $normalized = self::normalizePermissions($permissions);

        if ($normalized === null) {
            return $defaults;
        }

        return $normalized;
    }
}