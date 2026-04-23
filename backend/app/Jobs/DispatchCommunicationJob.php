<?php

namespace App\Jobs;

use App\Models\Communication;
use App\Services\Communication\CommunicationDispatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchCommunicationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $communicationId,
    ) {
    }

    public function handle(CommunicationDispatchService $dispatchService): void
    {
        $communication = Communication::query()->with(['attempts', 'template', 'contact', 'creator'])->find($this->communicationId);

        if (! $communication) {
            return;
        }

        $dispatchService->dispatch($communication);
    }
}