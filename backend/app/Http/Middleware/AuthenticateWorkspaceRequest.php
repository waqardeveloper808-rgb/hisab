<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateWorkspaceRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $company = $this->resolveActiveCompany($request);

        if (! $company) {
            abort(401, 'Workspace company is not configured.');
        }

        if ($request->user()) {
            return $next($request);
        }

        $configuredToken = (string) config('workspace.api_token');
        $providedToken = (string) $request->header('X-Gulf-Hisab-Workspace-Token', '');

        if ($configuredToken === '' || $providedToken === '' || ! hash_equals($configuredToken, $providedToken)) {
            abort(401, 'Unauthenticated.');
        }

        $user = $this->resolveWorkspaceUser($request);

        if (! $user) {
            abort(401, 'Workspace actor is not configured.');
        }

        $request->setUserResolver(static fn (): User => $user);

        return $next($request);
    }

    private function resolveActiveCompany(Request $request): ?Company
    {
        $routeCompany = $request->route('company');
        $activeCompanyId = (int) $request->header('X-Gulf-Hisab-Active-Company-Id', 0);

        if ($routeCompany instanceof Company) {
            if ($activeCompanyId > 0 && (int) $routeCompany->id !== $activeCompanyId) {
                abort(403, 'Workspace company mismatch.');
            }

            return $routeCompany;
        }

        if ($activeCompanyId > 0) {
            return Company::query()->find($activeCompanyId);
        }

        return null;
    }

    private function resolveWorkspaceUser(Request $request): ?User
    {
        $company = $this->resolveActiveCompany($request);
        $actorId = (int) $request->header('X-Gulf-Hisab-Actor-Id', 0);

        if ($actorId > 0 && $company instanceof Company) {
            $companyUser = $company->users()
                ->where('users.id', $actorId)
                ->wherePivot('is_active', true)
                ->first();

            if ($companyUser) {
                return $companyUser;
            }
        }

        if ($actorId > 0) {
            $actor = User::query()->find($actorId);

            if ($actor) {
                return $actor;
            }
        }

        $configuredUserId = config('workspace.user_id');

        if ($configuredUserId) {
            return User::query()->find($configuredUserId);
        }

        if (! $company instanceof Company) {
            return null;
        }

        return $company->users()
            ->wherePivot('is_active', true)
            ->orderBy('users.id')
            ->first();
    }
}
