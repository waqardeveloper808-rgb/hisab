<?php

namespace App\Http\Controllers\Api;

use App\Models\Company;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends ItemController
{
    public function index(Request $request, Company $company): JsonResponse
    {
        return $this->listItems($request, $company, 'product');
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        return $this->createItem($request, $company, 'product');
    }

    public function show(Request $request, Company $company, Item $product): JsonResponse
    {
        return $this->showItem($request, $company, $product, 'product');
    }

    public function update(Request $request, Company $company, Item $product): JsonResponse
    {
        return $this->updateItem($request, $company, $product, 'product');
    }

    public function destroy(Request $request, Company $company, Item $product): JsonResponse
    {
        return $this->destroyItem($request, $company, $product, 'product');
    }

    public function search(Request $request, Company $company): JsonResponse
    {
        return $this->listItems($request, $company, 'product');
    }

    public function stock(Request $request, Company $company): JsonResponse
    {
        return $this->stockItems($request, $company, 'product');
    }
}