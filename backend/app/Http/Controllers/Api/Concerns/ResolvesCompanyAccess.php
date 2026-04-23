<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\Item;
use App\Models\Payment;
use App\Models\User;
use App\Support\AccessMatrix;
use Illuminate\Auth\Access\AuthorizationException;

trait ResolvesCompanyAccess
{
    protected function ensureCompanyAccess(User $user, Company $company): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        $allowed = $this->companyMembership($user, $company) !== null;

        if (! $allowed) {
            throw new AuthorizationException('You do not have access to this company.');
        }
    }

    protected function ensurePlatformAbility(User $user, string $ability): void
    {
        if (! $user->hasPlatformAbility($ability)) {
            throw new AuthorizationException('You do not have access to this platform area.');
        }
    }

    protected function ensureCompanyAbility(User $user, Company $company, string $ability): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        $membership = $this->companyMembership($user, $company);

        if (! $membership) {
            throw new AuthorizationException('You do not have access to this company.');
        }

        if (! AccessMatrix::hasAbility($this->resolveCompanyAbilities($membership), $ability)) {
            throw new AuthorizationException('You do not have permission for this company action.');
        }
    }

    protected function ensureCompanyUserManagement(User $user, Company $company): void
    {
        if ($user->isSuperAdmin() || $user->hasPlatformAbility('company.users.manage')) {
            return;
        }

        $this->ensureCompanyAbility($user, $company, 'company.users.manage');
    }

    protected function companyMembership(User $user, Company $company): ?User
    {
        return $company->users()
            ->where('users.id', $user->id)
            ->wherePivot('is_active', true)
            ->first();
    }

    protected function resolveCompanyAbilities(User $membership): array
    {
        return AccessMatrix::companyAbilitiesFor(
            $membership->pivot->role,
            $this->normalizePermissions($membership->pivot->permissions),
        );
    }

    protected function normalizePermissions(mixed $permissions): ?array
    {
        return AccessMatrix::normalizePermissions($permissions);
    }

    protected function ensureDocumentOwnership(Company $company, Document $document): void
    {
        if ($document->company_id !== $company->id) {
            throw new AuthorizationException('Document does not belong to this company.');
        }
    }

    protected function ensureContactOwnership(Company $company, Contact $contact): void
    {
        if ($contact->company_id !== $company->id) {
            throw new AuthorizationException('Contact does not belong to this company.');
        }
    }

    protected function ensureItemOwnership(Company $company, Item $item): void
    {
        if ($item->company_id !== $company->id) {
            throw new AuthorizationException('Item does not belong to this company.');
        }
    }

    protected function ensurePaymentOwnership(Company $company, Payment $payment): void
    {
        if ($payment->company_id !== $company->id) {
            throw new AuthorizationException('Payment does not belong to this company.');
        }
    }
}