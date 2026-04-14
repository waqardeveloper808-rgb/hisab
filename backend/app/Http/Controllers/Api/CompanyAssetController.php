<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyAssetController extends Controller
{
    use ResolvesCompanyAccess;

    public function index(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        return response()->json([
            'data' => CompanyAsset::query()->where('company_id', $company->id)->orderByDesc('id')->get(),
        ]);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'company.settings.manage');

        $payload = $request->validate([
            'type' => ['required', 'in:logo,icon,attachment'],
            'usage' => ['nullable', 'string', 'max:40'],
            'file' => ['required', 'file', 'max:2048', 'mimes:svg,png,jpg,jpeg,webp,pdf'],
        ]);

        $file = $payload['file'];
        $path = $file->store("companies/{$company->id}/assets", 'public');

        $asset = CompanyAsset::query()->create([
            'company_id' => $company->id,
            'type' => $payload['type'],
            'usage' => $payload['usage'] ?? null,
            'original_name' => $file->getClientOriginalName(),
            'disk' => 'public',
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'extension' => $file->getClientOriginalExtension(),
            'size_bytes' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $asset], 201);
    }
}