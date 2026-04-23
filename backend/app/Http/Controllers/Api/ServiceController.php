<?php

namespace App\Http\Controllers\Api;

use App\Models\Company;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends ItemController
{
    public function index(Request $request, Company $company): JsonResponse
    {
        return $this->listItems($request, $company, 'service');
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        return $this->createItem($request, $company, 'service');
    }

    public function show(Request $request, Company $company, Item $service): JsonResponse
    {
        return $this->showItem($request, $company, $service, 'service');
    }

    public function update(Request $request, Company $company, Item $service): JsonResponse
    {
        return $this->updateItem($request, $company, $service, 'service');
    }

    public function destroy(Request $request, Company $company, Item $service): JsonResponse
    {
        return $this->destroyItem($request, $company, $service, 'service');
    }
}