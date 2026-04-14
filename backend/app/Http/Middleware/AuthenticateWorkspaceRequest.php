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

    private function resolveWorkspaceUser(Request $request): ?User
    {
        $company = $request->route('company');
        $actorId = (int) $request->header('X-Gulf-Hisab-Actor-Id', 0);

        if ($actorId > 0 && $company instanceof Company) {
            return $company->users()
                ->where('users.id', $actorId)
                ->wherePivot('is_active', true)
                ->first();
        }

        if ($actorId > 0) {
            return User::query()->find($actorId);
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