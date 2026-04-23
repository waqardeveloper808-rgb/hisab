<?php

namespace App\Services\Communication;

use App\Jobs\DispatchCommunicationJob;
use App\Models\Communication;

class CommunicationRetryService
{
    public function retry(Communication $communication): Communication
    {
        abort_if($communication->retry_count >= 3, 422, 'Communication retry limit has been reached.');
        abort_if($communication->status === 'cancelled', 422, 'Cancelled communications cannot be retried.');

        $communication->update([
            'status' => 'queued',
            'retry_count' => $communication->retry_count + 1,
            'failed_at' => null,
            'queued_at' => now(),
        ]);

        DispatchCommunicationJob::dispatchSync($communication->id);

        return $communication->fresh(['attempts', 'template', 'contact', 'creator']);
    }
}