<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductServiceRouteCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_services_and_items_routes_are_company_scoped_and_operational(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $companyId = $this->postJson('/api/companies', [
            'legal_name' => 'Catalog Coverage Co',
        ])->json('data.id');

        $company = Company::findOrFail($companyId);
        $taxCategoryId = TaxCategory::query()->where('company_id', $companyId)->where('code', 'VAT15')->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');
        $expenseAccountId = $company->accounts()->where('code', '6900')->value('id');

        $product = $this->postJson("/api/companies/{$companyId}/products", [
            'name' => 'Steel Cabinet',
            'sku' => 'STEEL-CAB-01',
            'inventory_classification' => 'inventory_tracked',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 350,
            'default_purchase_price' => 210,
        ])->assertCreated();

        $productId = $product->json('data.id');
        $this->assertSame('product', $product->json('data.type'));

        $service = $this->postJson("/api/companies/{$companyId}/services", [
            'name' => 'Installation Labor',
            'sku' => 'INSTALL-01',
            'inventory_classification' => 'non_stock_service',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'expense_account_id' => $expenseAccountId,
            'default_sale_price' => 95,
            'default_purchase_price' => 25,
        ])->assertCreated();

        $serviceId = $service->json('data.id');
        $this->assertSame('service', $service->json('data.type'));

        $this->getJson("/api/companies/{$companyId}/products")
            ->assertOk()
            ->assertJsonPath('data.0.id', $productId)
            ->assertJsonPath('data.0.type', 'product');

        $this->getJson("/api/companies/{$companyId}/products/search?search=Steel")
            ->assertOk()
            ->assertJsonPath('data.0.id', $productId);

        $this->putJson("/api/companies/{$companyId}/products/{$productId}", [
            'name' => 'Steel Cabinet XL',
            'default_sale_price' => 375,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Steel Cabinet XL')
            ->assertJsonPath('data.default_sale_price', '375.00');

        $this->getJson("/api/companies/{$companyId}/services")
            ->assertOk()
            ->assertJsonPath('data.0.id', $serviceId)
            ->assertJsonPath('data.0.type', 'service');

        $this->putJson("/api/companies/{$companyId}/services/{$serviceId}", [
            'name' => 'Installation And Setup',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Installation And Setup');

        $this->getJson("/api/companies/{$companyId}/items")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->postJson("/api/companies/{$companyId}/inventory/stock", [
            'item_id' => $productId,
            'product_name' => 'Steel Cabinet XL',
            'inventory_type' => 'finished_good',
            'source' => 'purchase',
            'code' => 'STEEL-CAB-01',
            'quantity_on_hand' => 8,
            'unit_cost' => 210,
            'offset_account_code' => '2000',
            'reference' => 'PO-CATALOG-01',
            'transaction_date' => '2026-04-21',
        ], [
            'X-Gulf-Hisab-Actor-Id' => (string) $user->id,
        ])->assertCreated();

        $this->getJson("/api/companies/{$companyId}/products/stock")
            ->assertOk()
            ->assertJsonPath('data.0.item_id', $productId)
            ->assertJsonPath('data.0.item_type', 'product');

        $this->deleteJson("/api/companies/{$companyId}/services/{$serviceId}")
            ->assertOk()
            ->assertJsonPath('data.deleted', true);

        $this->deleteJson("/api/companies/{$companyId}/products/{$productId}")
            ->assertOk()
            ->assertJsonPath('meta.archived', true);
    }
}