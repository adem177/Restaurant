<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AllergenResource;
use App\Models\Allergen;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AllergenController extends Controller
{
    /**
     * Full allergen reference list (static, small), used by the client
     * "avoid allergens" filter and by the admin product form.
     */
    public function index(): AnonymousResourceCollection
    {
        return AllergenResource::collection(
            Allergen::orderBy('name_fr')->get()
        );
    }
}
