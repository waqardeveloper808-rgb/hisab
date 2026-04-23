<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Company;
use Illuminate\Database\Seeder;

class ComprehensiveChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $companies = Company::all();

        foreach ($companies as $company) {
            $existing = Account::where('company_id', $company->id)->count();
            if ($existing > 0) {
                continue; // Skip companies that already have accounts
            }

            foreach (self::accounts() as $acct) {
                Account::create(array_merge($acct, [
                    'company_id' => $company->id,
                ]));
            }
        }
    }

    public static function accounts(): array
    {
        return [
            // ═══════════════════════════════════════════════════════
            // ASSETS — Current Assets (1000 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '1010', 'name' => 'Cash in Hand', 'name_ar' => 'النقد في الصندوق', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'cash', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1020', 'name' => 'Petty Cash', 'name_ar' => 'صندوق المصروفات النثرية', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'cash', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1050', 'name' => 'Undeposited Funds', 'name_ar' => 'أموال غير مودعة', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'cash', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1100', 'name' => 'Accounts Receivable', 'name_ar' => 'ذمم مدينة', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'receivable', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '1110', 'name' => 'Allowance for Doubtful Debts', 'name_ar' => 'مخصص ديون مشكوك فيها', 'type' => 'contra', 'account_class' => 'contra', 'subtype' => 'contra_asset', 'group' => 'current_asset', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1150', 'name' => 'Inventory — Trading', 'name_ar' => 'مخزون تجاري', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'inventory', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1151', 'name' => 'Inventory — Raw Materials', 'name_ar' => 'مخزون مواد خام', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'inventory', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1152', 'name' => 'Inventory — Finished Goods', 'name_ar' => 'مخزون بضاعة تامة الصنع', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'inventory', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1153', 'name' => 'Work in Progress', 'name_ar' => 'إنتاج تحت التشغيل', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'inventory', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1200', 'name' => 'Main Bank Account', 'name_ar' => 'الحساب البنكي الرئيسي', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'bank', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1210', 'name' => 'Secondary Bank Account', 'name_ar' => 'الحساب البنكي الثانوي', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'bank', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1220', 'name' => 'Bank Clearing Account', 'name_ar' => 'حساب مقاصة بنكي', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'bank', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1300', 'name' => 'VAT Receivable (Input VAT)', 'name_ar' => 'ضريبة القيمة المضافة المستحقة', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'tax', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '1400', 'name' => 'Prepaid Expenses', 'name_ar' => 'مصروفات مدفوعة مقدماً', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'prepaid', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1410', 'name' => 'Supplier Advances', 'name_ar' => 'سلف الموردين', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'advance', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '1420', 'name' => 'Employee Advances', 'name_ar' => 'سلف الموظفين', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'advance', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1430', 'name' => 'Other Receivables', 'name_ar' => 'ذمم مدينة أخرى', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'receivable', 'group' => 'current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // ASSETS — Non-Current Assets (1500 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '1500', 'name' => 'Property / Building', 'name_ar' => 'عقارات / مباني', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'fixed_asset', 'group' => 'non_current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1510', 'name' => 'Machinery / Equipment', 'name_ar' => 'آلات / معدات', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'fixed_asset', 'group' => 'non_current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1520', 'name' => 'Vehicles', 'name_ar' => 'مركبات', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'fixed_asset', 'group' => 'non_current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1530', 'name' => 'Furniture / Fixtures', 'name_ar' => 'أثاث / تجهيزات', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'fixed_asset', 'group' => 'non_current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1540', 'name' => 'Computers / IT Equipment', 'name_ar' => 'حواسيب / معدات تقنية', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'fixed_asset', 'group' => 'non_current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1590', 'name' => 'Accumulated Depreciation', 'name_ar' => 'إهلاك متراكم', 'type' => 'contra', 'account_class' => 'contra', 'subtype' => 'contra_asset', 'group' => 'non_current_asset', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '1600', 'name' => 'Long-term Deposits', 'name_ar' => 'ودائع طويلة الأجل', 'type' => 'asset', 'account_class' => 'asset', 'subtype' => 'other', 'group' => 'non_current_asset', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // LIABILITIES — Current (2000 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '2000', 'name' => 'Accounts Payable', 'name_ar' => 'ذمم دائنة', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'payable', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '2100', 'name' => 'Accrued Expenses', 'name_ar' => 'مصروفات مستحقة', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'accrual', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2110', 'name' => 'Salaries Payable', 'name_ar' => 'رواتب مستحقة', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'accrual', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2120', 'name' => 'Bonus Payable', 'name_ar' => 'مكافآت مستحقة', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'accrual', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2200', 'name' => 'VAT Payable (Output VAT)', 'name_ar' => 'ضريبة القيمة المضافة المستحقة الدفع', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'tax', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '2210', 'name' => 'Tax Payable', 'name_ar' => 'ضريبة مستحقة الدفع', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'tax', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2300', 'name' => 'Customer Advances', 'name_ar' => 'سلف العملاء', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'advance', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '2310', 'name' => 'Deferred Revenue (Short-term)', 'name_ar' => 'إيرادات مؤجلة قصيرة الأجل', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'deferred', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2400', 'name' => 'Short-term Loans', 'name_ar' => 'قروض قصيرة الأجل', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'loan', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2410', 'name' => 'Bank Overdraft', 'name_ar' => 'تسهيلات بنكية', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'loan', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2500', 'name' => 'Other Payables', 'name_ar' => 'ذمم دائنة أخرى', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'other', 'group' => 'current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // LIABILITIES — Non-Current (2600 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '2600', 'name' => 'Long-term Loans', 'name_ar' => 'قروض طويلة الأجل', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'loan', 'group' => 'non_current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2610', 'name' => 'Lease Liabilities', 'name_ar' => 'التزامات الإيجار', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'lease', 'group' => 'non_current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2620', 'name' => 'End-of-Service Benefit', 'name_ar' => 'مكافأة نهاية الخدمة', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'provision', 'group' => 'non_current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '2630', 'name' => 'Deferred Revenue (Long-term)', 'name_ar' => 'إيرادات مؤجلة طويلة الأجل', 'type' => 'liability', 'account_class' => 'liability', 'subtype' => 'deferred', 'group' => 'non_current_liability', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // EQUITY (3000 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '3000', 'name' => 'Owner Capital / Share Capital', 'name_ar' => 'رأس المال', 'type' => 'equity', 'account_class' => 'equity', 'subtype' => 'capital', 'group' => 'equity', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '3100', 'name' => 'Drawings / Owner Withdrawals', 'name_ar' => 'مسحوبات شخصية', 'type' => 'equity', 'account_class' => 'equity', 'subtype' => 'drawing', 'group' => 'equity', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '3200', 'name' => 'Retained Earnings', 'name_ar' => 'أرباح محتجزة', 'type' => 'equity', 'account_class' => 'equity', 'subtype' => 'retained', 'group' => 'equity', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '3300', 'name' => 'Current Year Earnings', 'name_ar' => 'أرباح السنة الحالية', 'type' => 'equity', 'account_class' => 'equity', 'subtype' => 'current_year', 'group' => 'equity', 'normal_balance' => 'credit', 'allows_posting' => false, 'is_system' => true, 'is_active' => true],
            ['code' => '3400', 'name' => 'Reserves', 'name_ar' => 'احتياطيات', 'type' => 'equity', 'account_class' => 'equity', 'subtype' => 'reserve', 'group' => 'equity', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '3900', 'name' => 'Opening Balance Equity', 'name_ar' => 'حقوق ملكية الأرصدة الافتتاحية', 'type' => 'equity', 'account_class' => 'equity', 'subtype' => 'opening', 'group' => 'equity', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // INCOME / REVENUE (4000 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '4000', 'name' => 'Sales Revenue', 'name_ar' => 'إيرادات المبيعات', 'type' => 'income', 'account_class' => 'income', 'subtype' => 'operating', 'group' => 'operating_revenue', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '4010', 'name' => 'Service Revenue', 'name_ar' => 'إيرادات الخدمات', 'type' => 'income', 'account_class' => 'income', 'subtype' => 'operating', 'group' => 'operating_revenue', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '4020', 'name' => 'Other Operating Revenue', 'name_ar' => 'إيرادات تشغيلية أخرى', 'type' => 'income', 'account_class' => 'income', 'subtype' => 'operating', 'group' => 'operating_revenue', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '4100', 'name' => 'Discount Received', 'name_ar' => 'خصم مكتسب', 'type' => 'income', 'account_class' => 'income', 'subtype' => 'other', 'group' => 'other_revenue', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '4200', 'name' => 'Gain on Disposal', 'name_ar' => 'أرباح بيع أصول', 'type' => 'income', 'account_class' => 'income', 'subtype' => 'other', 'group' => 'other_revenue', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '4300', 'name' => 'Finance Income', 'name_ar' => 'إيرادات مالية', 'type' => 'income', 'account_class' => 'income', 'subtype' => 'financial', 'group' => 'other_revenue', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '4900', 'name' => 'Miscellaneous Income', 'name_ar' => 'إيرادات متنوعة', 'type' => 'income', 'account_class' => 'income', 'subtype' => 'other', 'group' => 'other_revenue', 'normal_balance' => 'credit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // COST OF SALES / DIRECT COST (5000 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'name_ar' => 'تكلفة البضاعة المباعة', 'type' => 'cost_of_sales', 'account_class' => 'cost_of_sales', 'subtype' => 'cogs', 'group' => 'cost_of_goods_sold', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => true, 'is_active' => true],
            ['code' => '5010', 'name' => 'Direct Materials Consumed', 'name_ar' => 'مواد مباشرة مستهلكة', 'type' => 'cost_of_sales', 'account_class' => 'cost_of_sales', 'subtype' => 'direct', 'group' => 'cost_of_goods_sold', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '5020', 'name' => 'Direct Labor', 'name_ar' => 'عمالة مباشرة', 'type' => 'cost_of_sales', 'account_class' => 'cost_of_sales', 'subtype' => 'direct', 'group' => 'cost_of_goods_sold', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '5030', 'name' => 'Production Overhead Absorbed', 'name_ar' => 'أعباء إنتاج ممتصة', 'type' => 'cost_of_sales', 'account_class' => 'cost_of_sales', 'subtype' => 'overhead', 'group' => 'cost_of_goods_sold', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '5040', 'name' => 'Purchase Variance', 'name_ar' => 'فروقات الشراء', 'type' => 'cost_of_sales', 'account_class' => 'cost_of_sales', 'subtype' => 'variance', 'group' => 'cost_of_goods_sold', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '5050', 'name' => 'Inventory Adjustment', 'name_ar' => 'تسوية مخزون', 'type' => 'cost_of_sales', 'account_class' => 'cost_of_sales', 'subtype' => 'adjustment', 'group' => 'cost_of_goods_sold', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // OPERATING EXPENSES (6000 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '6000', 'name' => 'Rent Expense', 'name_ar' => 'مصروف الإيجار', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6010', 'name' => 'Utilities Expense', 'name_ar' => 'مصروف المرافق', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6020', 'name' => 'Office Supplies', 'name_ar' => 'مستلزمات مكتبية', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6030', 'name' => 'Internet / Communication', 'name_ar' => 'إنترنت / اتصالات', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6040', 'name' => 'Fuel / Travel', 'name_ar' => 'وقود / سفر', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6050', 'name' => 'Maintenance Expense', 'name_ar' => 'مصروف صيانة', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6060', 'name' => 'Insurance Expense', 'name_ar' => 'مصروف تأمين', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6070', 'name' => 'Marketing Expense', 'name_ar' => 'مصروف تسويق', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6080', 'name' => 'Professional Fees', 'name_ar' => 'أتعاب مهنية', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'operating', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6100', 'name' => 'Salaries Expense', 'name_ar' => 'مصروف الرواتب', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'payroll', 'group' => 'payroll', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6110', 'name' => 'Bonus Expense', 'name_ar' => 'مصروف مكافآت', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'payroll', 'group' => 'payroll', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6120', 'name' => 'Overtime Expense', 'name_ar' => 'مصروف عمل إضافي', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'payroll', 'group' => 'payroll', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6200', 'name' => 'Bank Charges', 'name_ar' => 'عمولات بنكية', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'financial', 'group' => 'financial', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6300', 'name' => 'Depreciation Expense', 'name_ar' => 'مصروف إهلاك', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'non_cash', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
            ['code' => '6900', 'name' => 'Miscellaneous Expense', 'name_ar' => 'مصروفات متنوعة', 'type' => 'expense', 'account_class' => 'expense', 'subtype' => 'other', 'group' => 'operating_expense', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],

            // ═══════════════════════════════════════════════════════
            // SALES DISCOUNT / CONTRA REVENUE (4500 series)
            // ═══════════════════════════════════════════════════════
            ['code' => '4500', 'name' => 'Sales Discount', 'name_ar' => 'خصم مبيعات', 'type' => 'contra', 'account_class' => 'contra', 'subtype' => 'contra_revenue', 'group' => 'contra_revenue', 'normal_balance' => 'debit', 'allows_posting' => true, 'is_system' => false, 'is_active' => true],
        ];
    }
}
