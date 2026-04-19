<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $request = request();

        return response()->json(
            MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)
                ->orderBy('name')
                ->get()
                ->map(fn (MenuCategory $category) => $this->serializeCategory($category, $request))
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|required|string|not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME,
            'name_hu' => 'sometimes|required|string|not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME,
            'name_en' => 'sometimes|required|string|not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME,
        ]);

        [$nameHu, $nameEn] = $this->resolveNames($request);

        if ($nameHu === '' || $nameEn === '') {
            return response()->json([
                'message' => $this->t([
                    'hu' => 'Kérlek adj meg legalább egy kategória nevet (HU vagy EN).',
                    'en' => 'Please provide at least one category name (HU or EN).',
                ], $request),
            ], 422);
        }

        $category = MenuCategory::create([
            'name' => $nameHu,
            'name_hu' => $nameHu,
            'name_en' => $nameEn,
        ]);

        return response()->json($this->serializeCategory($category, $request), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuCategory $menu_category)
    {
        $request = request();
        return response()->json($this->serializeCategory($menu_category, $request));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MenuCategory $menu_category)
    {
        $request->validate([
            'name' => ['sometimes', 'required', 'string', 'not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME],
            'name_hu' => ['sometimes', 'required', 'string', 'not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME],
            'name_en' => ['sometimes', 'required', 'string', 'not_in:' . MenuCategory::UNAVAILABLE_CATEGORY_NAME],
        ]);

        [$nameHu, $nameEn] = $this->resolveNames($request, $menu_category->name_hu ?? $menu_category->name, $menu_category->name_en ?? $menu_category->name);

        if ($nameHu === '' || $nameEn === '') {
            return response()->json([
                'message' => $this->t([
                    'hu' => 'A kategória magyar és angol neve nem lehet üres.',
                    'en' => 'Category Hungarian and English names cannot be empty.',
                ], $request),
            ], 422);
        }

        $conflict = MenuCategory::query()
            ->where('id', '!=', $menu_category->id)
            ->where(function ($query) use ($nameHu, $nameEn) {
                $query
                    ->where('name_hu', $nameHu)
                    ->orWhere('name_en', $nameEn);
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => $this->t([
                    'hu' => 'Már létezik ilyen nevű kategória.',
                    'en' => 'A category with this name already exists.',
                ], $request),
            ], 422);
        }

        $menu_category->update([
            'name' => $nameHu,
            'name_hu' => $nameHu,
            'name_en' => $nameEn,
        ]);

        return response()->json($this->serializeCategory($menu_category, $request), 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MenuCategory $menu_category)
    {
        $menu_category->delete();

        return response()->json("", 204);
    }

    private function resolveNames(Request $request, string $fallbackHu = '', string $fallbackEn = ''): array
    {
        $name = trim((string) $request->input('name', ''));
        $nameHu = trim((string) $request->input('name_hu', $name !== '' ? $name : $fallbackHu));
        $nameEn = trim((string) $request->input('name_en', $name !== '' ? $name : $fallbackEn));

        if ($nameHu === '' && $nameEn !== '') {
            $nameHu = $nameEn;
        }

        if ($nameEn === '' && $nameHu !== '') {
            $nameEn = $nameHu;
        }

        return [$nameHu, $nameEn];
    }

    private function serializeCategory(MenuCategory $category, Request $request): array
    {
        $nameHu = $category->name_hu ?? $category->name;
        $nameEn = $category->name_en ?? $category->name;

        return [
            'id' => $category->id,
            'name' => $this->localizedName($nameHu, $nameEn, $request),
            'name_hu' => $nameHu,
            'name_en' => $nameEn,
            'created_at' => $category->created_at,
            'updated_at' => $category->updated_at,
        ];
    }
}
