<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $locale = $request->input('lang', 'fr');

        return CategoryResource::collection(
            Category::orderBy('id')->get()
        )->additional(['lang' => $locale]);
    }
}
