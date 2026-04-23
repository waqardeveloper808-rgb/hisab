<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('platform_role', 30)->default('customer')->after('password');
            $table->json('support_permissions')->nullable()->after('platform_role');
            $table->boolean('is_platform_active')->default(true)->after('support_permissions');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('is_active');
            $table->string('suspended_reason', 255)->nullable()->after('suspended_at');
        });

        Schema::table('product_settings', function (Blueprint $table) {
            $table->string('support_display_name')->default('Gulf Hisab Support')->after('id');
            $table->string('support_email')->default('support@gulfhisab.sa')->after('support_whatsapp_number');
        });

        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('monthly_price_sar', 10, 2)->default(0);
            $table->decimal('annual_price_sar', 10, 2)->nullable();
            $table->unsignedInteger('trial_days')->default(0);
            $table->unsignedInteger('invoice_limit')->nullable();
            $table->unsignedInteger('customer_limit')->nullable();
            $table->unsignedInteger('accountant_seat_limit')->nullable();
            $table->json('feature_flags')->nullable();
            $table->json('marketing_points')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->boolean('is_free')->default(false);
            $table->boolean('is_paid')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('company_id')->constrained('subscription_plans')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
        });

        Schema::dropIfExists('subscription_plans');

        Schema::table('product_settings', function (Blueprint $table) {
            $table->dropColumn(['support_display_name', 'support_email']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['suspended_at', 'suspended_reason']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['platform_role', 'support_permissions', 'is_platform_active']);
        });
    }
};