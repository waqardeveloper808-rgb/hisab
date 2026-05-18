<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ContactImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_contact_create_persists_cr_opening_balance_and_balance_metadata(): void
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => 'Contact Import Sandbox',
        ])->assertCreated()->json('data.id');

        $created = $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", array_merge([
            'type' => 'customer',
            'display_name' => 'CRM Import Probe',
            'tax_number' => $this->uniqueKsaVatNumber('crm-import-probe'),
            'commercial_registration_number' => '7080901021',
            'opening_balance_amount' => 12580.42,
            'opening_balance_type' => 'normal_debit',
            'opening_balance_as_of' => '2026-04-05',
        ], $this->ksaContactExtras()))->assertCreated()->json('data');

        $this->assertSame('7080901021', $created['commercial_registration_number'] ?? null);
        $this->assertEqualsWithDelta(12580.42, (float) ($created['opening_balance'] ?? 0), 0.02);
        $this->assertSame('normal_debit', $created['opening_balance_type'] ?? null);
        $this->assertSame('2026-04-05', $created['opening_balance_as_of'] ?? null);

        $fromIndex = collect($this->actingAs($user)->getJson("/api/companies/{$companyId}/contacts")->assertOk()->json('data'))
            ->firstWhere('display_name', 'CRM Import Probe');
        $this->assertNotNull($fromIndex);
        $this->assertSame('7080901021', $fromIndex['commercial_registration_number'] ?? null);
        $this->assertEqualsWithDelta(12580.42, (float) ($fromIndex['opening_balance'] ?? 0), 0.02);
        $this->assertSame('normal_debit', $fromIndex['opening_balance_type'] ?? null);
        $this->assertSame('2026-04-05', $fromIndex['opening_balance_as_of'] ?? null);
    }
}
