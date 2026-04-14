<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->string('usage', 40)->nullable();
            $table->string('original_name');
            $table->string('disk', 40)->default('public');
            $table->string('path');
            $table->string('mime_type', 120)->nullable();
            $table->string('extension', 20)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->boolean('is_active')->default(true);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['company_id', 'type', 'usage']);
        });

        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->json('document_types')->nullable();
            $table->string('locale_mode', 20)->default('bilingual');
            $table->string('accent_color', 20)->default('#1f7a53');
            $table->string('watermark_text', 120)->nullable();
            $table->text('header_html')->nullable();
            $table->text('footer_html')->nullable();
            $table->json('settings')->nullable();
            $table->foreignId('logo_asset_id')->nullable()->constrained('company_assets')->nullOnDelete();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('custom_field_definitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug', 80);
            $table->string('field_type', 30)->default('text');
            $table->string('placement', 20)->default('document');
            $table->json('applies_to')->nullable();
            $table->json('options')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'slug']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('template_id')->nullable()->after('source_document_id')->constrained('document_templates')->nullOnDelete();
            $table->string('language_code', 10)->default('en')->after('currency_code');
            $table->string('title')->nullable()->after('document_number');
            $table->json('custom_fields')->nullable()->after('notes');
            $table->json('attachments')->nullable()->after('custom_fields');
            $table->string('sent_to_email')->nullable()->after('sent_at');
            $table->string('sent_via', 20)->nullable()->after('sent_to_email');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('template_id');
            $table->dropColumn(['language_code', 'title', 'custom_fields', 'attachments', 'sent_to_email', 'sent_via']);
        });

        Schema::dropIfExists('custom_field_definitions');
        Schema::dropIfExists('document_templates');
        Schema::dropIfExists('company_assets');
    }
};