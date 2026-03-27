<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function preferredLocale(?Request $request = null): string
    {
        $header = (string) ($request?->header('Accept-Language') ?? request()->header('Accept-Language', 'hu'));
        $first = strtolower(trim(explode(',', $header)[0] ?? 'hu'));

        return str_starts_with($first, 'en') ? 'en' : 'hu';
    }

    protected function t(array $messages, ?Request $request = null): string
    {
        $locale = $this->preferredLocale($request);

        return $messages[$locale] ?? $messages['hu'] ?? $messages['en'] ?? '';
    }

    protected function localizedName(string $nameHu, string $nameEn, ?Request $request = null): string
    {
        return $this->preferredLocale($request) === 'en' ? $nameEn : $nameHu;
    }
}
