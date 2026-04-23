<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_templates', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 120);
            $table->string('name');
            $table->string('channel', 30);
            $table->string('source_type', 60)->nullable();
            $table->string('subject_template')->nullable();
            $table->longText('body_html_template')->nullable();
            $table->longText('body_text_template')->nullable();
            $table->json('variables')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'code']);
            $table->index(['channel', 'source_type', 'is_default']);
        });

        Schema::create('communications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('communication_templates')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source_type', 60)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('source_record_type', 60)->nullable();
            $table->string('channel', 30);
            $table->string('direction', 20)->default('outbound');
            $table->string('status', 30)->default('draft');
            $table->string('target_address')->nullable();
            $table->string('target_name')->nullable();
            $table->string('subject')->nullable();
            $table->longText('body_html')->nullable();
            $table->longText('body_text')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->json('metadata')->nullable();
            $table->json('learning_snapshot')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'channel', 'status']);
            $table->index(['company_id', 'source_type', 'source_id']);
        });

        Schema::create('communication_attempts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('communication_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('attempt_number');
            $table->string('channel', 30);
            $table->string('transport', 40)->nullable();
            $table->string('status', 30);
            $table->string('target_address')->nullable();
            $table->string('subject')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->string('provider_message_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('attempted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['communication_id', 'attempt_number']);
        });

        Schema::create('communication_learning_signals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 30);
            $table->string('source_type', 60)->nullable();
            $table->string('recipient_domain')->nullable();
            $table->string('template_code', 120)->nullable();
            $table->string('signal_key', 160);
            $table->unsignedInteger('success_count')->default(0);
            $table->unsignedInteger('failure_count')->default(0);
            $table->string('last_status', 30)->nullable();
            $table->text('last_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('learned_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'channel', 'source_type', 'recipient_domain', 'template_code', 'signal_key'], 'communication_learning_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_learning_signals');
        Schema::dropIfExists('communication_attempts');
        Schema::dropIfExists('communications');
        Schema::dropIfExists('communication_templates');
    }
};