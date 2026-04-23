<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'workspace.access' => \App\Http\Middleware\AuthenticateWorkspaceRequest::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\App\Exceptions\AccountingControlException $exception) {
            return response()->json([
                'control_id' => $exception->controlId,
                'message' => $exception->getMessage(),
            ], 422);
        });

        $exceptions->render(function (\LogicException $exception) {
            if (str_contains($exception->getMessage(), 'Posted journal')) {
                return response()->json([
                    'control_id' => 'CP-ACC-018',
                    'message' => $exception->getMessage(),
                ], 422);
            }

            return null;
        });
    })->create();
