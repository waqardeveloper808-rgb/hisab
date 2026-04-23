<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\JournalBatch;
use App\Models\JournalEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class JournalPostingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_journal_post_succeeds(): void
    {
        [$user, $company] = $this->companyContext();
        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $revenueId = $company->accounts()->where('code', '4000')->value('id');
        $sourceId = (string) Str::uuid();

        $this->actingAs($user)
            ->postJson('/api/journal/post', [
                'company_id' => $company->id,
                'source_type' => 'manual_test',
                'source_id' => $sourceId,
                'entry_date' => '2026-04-19',
                'description' => 'Valid journal',
                'entries' => [
                    ['account_id' => $cashId, 'debit' => 100, 'credit' => 0, 'description' => 'Debit'],
                    ['account_id' => $revenueId, 'debit' => 0, 'credit' => 100, 'description' => 'Credit'],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.source_id', $sourceId)
            ->assertJsonPath('data.status', 'posted');

        $batch = JournalBatch::query()->where('source_type', 'manual_test')->where('source_id', $sourceId)->first();
        $this->assertNotNull($batch);
        $this->assertSame('posted', $batch->status);
        $this->assertDatabaseCount('journal_entry_lines', 2);
    }

    public function test_unbalanced_journal_fails(): void
    {
        [$user, $company] = $this->companyContext();
        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $revenueId = $company->accounts()->where('code', '4000')->value('id');

        $this->actingAs($user)
            ->postJson('/api/journal/post', [
                'company_id' => $company->id,
                'source_type' => 'manual_test_unbalanced',
                'source_id' => (string) Str::uuid(),
                'entry_date' => '2026-04-19',
                'entries' => [
                    ['account_id' => $cashId, 'debit' => 100, 'credit' => 0],
                    ['account_id' => $revenueId, 'debit' => 0, 'credit' => 90],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('control_id', 'ACC-001');
    }

    public function test_single_entry_fails(): void
    {
        [$user, $company] = $this->companyContext();
        $cashId = $company->accounts()->where('code', '1200')->value('id');

        $this->actingAs($user)
            ->postJson('/api/journal/post', [
                'company_id' => $company->id,
                'source_type' => 'manual_test_single',
                'source_id' => (string) Str::uuid(),
                'entry_date' => '2026-04-19',
                'entries' => [
                    ['account_id' => $cashId, 'debit' => 100, 'credit' => 0],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('control_id', 'ACC-002');
    }

    public function test_duplicate_source_fails(): void
    {
        [$user, $company] = $this->companyContext();
        $cashId = $company->accounts()->where('code', '1200')->value('id');
        $revenueId = $company->accounts()->where('code', '4000')->value('id');
        $sourceId = (string) Str::uuid();

        $payload = [
            'company_id' => $company->id,
            'source_type' => 'manual_test_duplicate',
            'source_id' => $sourceId,
            'entry_date' => '2026-04-19',
            'entries' => [
                ['account_id' => $cashId, 'debit' => 100, 'credit' => 0],
                ['account_id' => $revenueId, 'debit' => 0, 'credit' => 100],
            ],
        ];

        $this->actingAs($user)->postJson('/api/journal/post', $payload)->assertCreated();
        $this->actingAs($user)->postJson('/api/journal/post', $payload)
            ->assertStatus(422)
            ->assertJsonPath('control_id', 'ACC-010');
    }

    private function companyContext(): array
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => 'Journal Posting Co',
        ])->json('data.id');

        return [$user, Company::findOrFail($companyId)];
    }
}