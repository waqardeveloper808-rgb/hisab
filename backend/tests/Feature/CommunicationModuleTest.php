<?php

namespace Tests\Feature;

use App\Models\Communication;
use App\Models\CommunicationTemplate;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CommunicationModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_send_creates_email_and_timeline_records_and_updates_learning_state(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $this->actingAs($user);

        [$company, $contact, $document] = $this->createFinalizedInvoiceContext($user);

        $response = $this->postJson("/api/companies/{$company->id}/documents/{$document->id}/send", [
            'subject' => 'Invoice {{document_number}}',
        ]);

        $response->assertOk();

        $emailCommunication = Communication::query()
            ->where('company_id', $company->id)
            ->where('source_type', 'document')
            ->where('source_id', $document->id)
            ->where('channel', 'email')
            ->firstOrFail();

        $this->assertSame('sent', $emailCommunication->status);
        $this->assertSame($contact->email, $emailCommunication->target_address);
        $this->assertSame(1, $emailCommunication->attempts()->count());
        $this->assertSame('sent', $emailCommunication->attempts()->first()->status);

        $mirrorCommunication = Communication::query()
            ->where('company_id', $company->id)
            ->where('source_type', 'document')
            ->where('source_id', $document->id)
            ->where('channel', 'in_app')
            ->firstOrFail();

        $this->assertSame('sent', $mirrorCommunication->status);
        $this->assertSame($emailCommunication->id, data_get($mirrorCommunication->metadata, 'mirrors_communication_id'));

        $timelineResponse = $this->getJson("/api/companies/{$company->id}/communications/source/document/{$document->id}");
        $timelineResponse->assertOk()->assertJsonCount(2, 'data');

        $document->refresh();
        $this->assertNotNull($document->sent_at);
        $this->assertSame($contact->email, $document->sent_to_email);
        $this->assertSame('email', $document->sent_via);

        $learningSignal = DB::table('communication_learning_signals')
            ->where('company_id', $company->id)
            ->where('channel', 'email')
            ->where('source_type', 'document')
            ->where('recipient_domain', 'example.com')
            ->where('signal_key', 'delivery')
            ->first();

        $this->assertNotNull($learningSignal);
        $this->assertSame(1, $learningSignal->success_count);
        $this->assertSame(0, $learningSignal->failure_count);
        $this->assertSame('sent', $learningSignal->last_status);
    }

    public function test_duplicate_document_send_returns_existing_email_communication_without_creating_new_records(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $this->actingAs($user);

        [$company, $contact, $document] = $this->createFinalizedInvoiceContext($user);

        $payload = [
            'subject' => 'Document delivery notice',
            'email' => $contact->email,
        ];

        $firstResponse = $this->postJson("/api/companies/{$company->id}/communications", array_merge($payload, [
            'channel' => 'email',
            'source_type' => 'document',
            'source_id' => $document->id,
        ]));
        $firstResponse->assertCreated();

        $secondResponse = $this->postJson("/api/companies/{$company->id}/communications", array_merge($payload, [
            'channel' => 'email',
            'source_type' => 'document',
            'source_id' => $document->id,
        ]));
        $secondResponse->assertCreated();

        $communications = Communication::query()
            ->where('company_id', $company->id)
            ->where('source_type', 'document')
            ->where('source_id', $document->id)
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $communications);
        $this->assertSame(['email', 'in_app'], $communications->pluck('channel')->all());
        $this->assertSame($firstResponse->json('data.id'), $secondResponse->json('data.id'));
    }

    public function test_generic_in_app_template_communication_resolves_variables_without_dispatch_attempts(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $company = $this->createCompany($user);
        $template = CommunicationTemplate::query()->create([
            'company_id' => $company->id,
            'code' => 'ops-follow-up',
            'name' => 'Ops follow up',
            'channel' => 'in_app',
            'source_type' => 'invoice',
            'subject_template' => 'Follow up for {{customer}}',
            'body_text_template' => 'Balance is {{amount}}',
            'is_default' => true,
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/companies/{$company->id}/communications", [
            'channel' => 'in_app',
            'source_type' => 'invoice',
            'template_id' => $template->id,
            'variables' => [
                'customer' => 'Acme Holding',
                'amount' => '450.00',
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'sent')
            ->assertJsonPath('data.subject', 'Follow up for Acme Holding')
            ->assertJsonPath('data.body_text', 'Balance is 450.00');

        $communication = Communication::findOrFail($response->json('data.id'));
        $this->assertSame('sent', $communication->status);
        $this->assertSame(0, $communication->attempts()->count());
        $this->assertNotNull($communication->dispatched_at);
        $this->assertNotNull($communication->delivered_at);
    }

    public function test_retry_succeeds_until_limit_then_blocks_further_attempts(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $this->actingAs($user);

        $company = $this->createCompany($user);
        $communication = Communication::query()->create([
            'company_id' => $company->id,
            'created_by' => $user->id,
            'channel' => 'email',
            'direction' => 'outbound',
            'status' => 'failed',
            'retry_count' => 2,
            'source_type' => 'document',
            'source_id' => 99,
            'target_address' => 'retry@example.com',
            'subject' => 'Retry subject',
            'body_text' => 'Retry body',
        ]);

        $retryResponse = $this->postJson("/api/companies/{$company->id}/communications/{$communication->id}/retry");

        $retryResponse->assertOk()->assertJsonPath('data.status', 'sent');

        $communication->refresh();
        $this->assertSame(3, $communication->retry_count);
        $this->assertSame('sent', $communication->status);
        $this->assertSame(1, $communication->attempts()->count());

        $limitResponse = $this->postJson("/api/companies/{$company->id}/communications/{$communication->id}/retry");
        $limitResponse->assertStatus(422);
        $this->assertSame('Communication retry limit has been reached.', $limitResponse->json('message'));
    }

    private function createCompany(User $user): Company
    {
        $companyResponse = $this->postJson('/api/companies', [
            'legal_name' => 'Communication Test Company',
            'trade_name' => 'Communication Test',
            'tax_number' => '300000000000003',
        ]);

        $companyResponse->assertCreated();

        return Company::findOrFail($companyResponse->json('data.id'));
    }

    private function createFinalizedInvoiceContext(User $user): array
    {
        $company = $this->createCompany($user);

        $contactResponse = $this->postJson("/api/companies/{$company->id}/contacts", [
            'type' => 'customer',
            'display_name' => 'Communication Customer',
            'email' => 'customer@example.com',
            'tax_number' => '300000000000010',
        ]);
        $contactResponse->assertCreated();
        $contact = Contact::findOrFail($contactResponse->json('data.id'));

        $taxCategoryId = TaxCategory::query()
            ->where('company_id', $company->id)
            ->where('code', 'VAT15')
            ->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');
        $documentTemplateId = $company->documentTemplates()->where('is_default', true)->value('id')
            ?? $company->documentTemplates()->value('id');

        $itemResponse = $this->postJson("/api/companies/{$company->id}/items", [
            'type' => 'service',
            'name' => 'Communication retainer',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'default_sale_price' => 100,
        ]);
        $itemResponse->assertCreated();

        $documentResponse = $this->postJson("/api/companies/{$company->id}/sales-documents", [
            'type' => 'tax_invoice',
            'contact_id' => $contact->id,
            'template_id' => $documentTemplateId,
            'issue_date' => '2026-04-20',
            'due_date' => '2026-04-30',
            'lines' => [
                [
                    'item_id' => $itemResponse->json('data.id'),
                    'quantity' => 1,
                    'unit_price' => 100,
                    'tax_category_id' => $taxCategoryId,
                    'ledger_account_id' => $incomeAccountId,
                ],
            ],
        ]);
        $documentResponse->assertCreated();

        $documentId = $documentResponse->json('data.id');
        $this->postJson("/api/companies/{$company->id}/sales-documents/{$documentId}/finalize")->assertOk();

        return [$company, $contact, Document::findOrFail($documentId)];
    }
}
