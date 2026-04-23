<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_settings', function (Blueprint $table) {
            $table->id();
            $table->string('support_whatsapp_number', 32)->default('966500000000');
            $table->unsignedInteger('free_trial_days')->default(45);
            $table->unsignedInteger('free_invoice_limit')->default(1);
            $table->decimal('paid_plan_monthly_price_sar', 10, 2)->default(40);
            $table->decimal('default_agent_commission_rate', 5, 2)->default(20);
            $table->timestamps();
        });

        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('referral_code', 40)->unique();
            $table->decimal('commission_rate', 5, 2)->default(20);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique('user_id');
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('plan_code', 40)->default('zatca-monthly');
            $table->string('plan_name')->default('ZATCA Monthly');
            $table->string('status', 30)->default('trialing');
            $table->decimal('monthly_price_sar', 10, 2)->default(40);
            $table->unsignedInteger('trial_days')->default(45);
            $table->unsignedInteger('free_invoice_limit')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('agent_referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referred_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->string('referral_code', 40);
            $table->decimal('commission_rate', 5, 2)->default(20);
            $table->decimal('commission_amount', 10, 2)->default(0);
            $table->string('commission_status', 30)->default('pending');
            $table->timestamp('signed_up_at')->nullable();
            $table->timestamp('subscribed_at')->nullable();
            $table->timestamps();

            $table->unique('referred_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_referrals');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('agents');
        Schema::dropIfExists('product_settings');
    }
};