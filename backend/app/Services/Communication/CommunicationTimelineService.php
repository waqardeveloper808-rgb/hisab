<?php

namespace App\Services\Communication;

use App\Models\Communication;
use App\Models\Company;
use Illuminate\Database\Eloquent\Collection;

class CommunicationTimelineService
{
    public function forSource(Company $company, string $sourceType, int $sourceId): Collection
    {
        return Communication::query()
            ->where('company_id', $company->id)
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->with(['attempts', 'template', 'contact', 'creator'])
            ->latest('id')
            ->get();
    }
}