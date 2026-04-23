<?php

namespace App\Support\Validation;

use Closure;

class KsaBusinessValidation
{
    public static function normalizeVatNumber(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = preg_replace('/\D+/', '', trim($value)) ?? '';

        return $normalized === '' ? null : $normalized;
    }

    public static function isValidKsaVatNumber(?string $value): bool
    {
        $normalized = self::normalizeVatNumber($value);

        return $normalized !== null
            && strlen($normalized) === 15
            && str_starts_with($normalized, '3')
            && str_ends_with($normalized, '3');
    }

    public static function vatRule(bool $required = false): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($required): void {
            $normalized = self::normalizeVatNumber(is_string($value) ? $value : null);

            if (! $required && ($value === null || trim((string) $value) === '')) {
                return;
            }

            if ($required && $normalized === null) {
                $fail('VAT number is required.');

                return;
            }

            if (! self::isValidKsaVatNumber($normalized)) {
                $fail('VAT number must be 15 digits, start with 3, end with 3, and contain numbers only.');
            }
        };
    }

    public static function normalizeSaudiPhone(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $trimmed) ?? '';
        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '00966')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '966') && strlen($digits) === 12) {
            return '+'.$digits;
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '0')) {
            return '+966'.substr($digits, 1);
        }

        if (strlen($digits) === 9) {
            return '+966'.$digits;
        }

        return str_starts_with($trimmed, '+') ? '+'.$digits : $trimmed;
    }

    public static function normalizeCountry(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = strtoupper(trim($value));
        if ($trimmed === '') {
            return null;
        }

        return match ($trimmed) {
            'SAUDI ARABIA', 'KSA', 'SA' => 'SA',
            default => $trimmed,
        };
    }

    public static function addressRules(string $prefix, bool $required = true): array
    {
        $requiredRule = $required ? ['required'] : ['nullable'];

        return [
            $prefix.'building_number' => array_merge($requiredRule, ['digits:4']),
            $prefix.'street_name' => array_merge($requiredRule, ['string', 'max:255']),
            $prefix.'district' => array_merge($requiredRule, ['string', 'max:255']),
            $prefix.'city' => array_merge($requiredRule, ['string', 'max:120']),
            $prefix.'postal_code' => array_merge($requiredRule, ['digits:5']),
            $prefix.'secondary_number' => array_merge($requiredRule, ['digits:4']),
            $prefix.'country' => array_merge($requiredRule, ['string', 'size:2']),
        ];
    }

    public static function normalizeAddress(?array $address): ?array
    {
        if ($address === null) {
            return null;
        }

        $street = trim((string) ($address['street_name'] ?? $address['line_1'] ?? ''));
        $district = trim((string) ($address['district'] ?? ''));
        $city = trim((string) ($address['city'] ?? ''));
        $country = self::normalizeCountry((string) ($address['country'] ?? ''));
        $buildingNumber = preg_replace('/\D+/', '', (string) ($address['building_number'] ?? '')) ?? '';
        $postalCode = preg_replace('/\D+/', '', (string) ($address['postal_code'] ?? '')) ?? '';
        $secondaryNumber = preg_replace('/\D+/', '', (string) ($address['secondary_number'] ?? $address['additional_number'] ?? '')) ?? '';

        if ($street === '' && $district === '' && $city === '' && $country === null && $buildingNumber === '' && $postalCode === '' && $secondaryNumber === '') {
            return null;
        }

        return [
            'building_number' => $buildingNumber,
            'street_name' => $street,
            'line_1' => $street,
            'district' => $district,
            'city' => $city,
            'postal_code' => $postalCode,
            'secondary_number' => $secondaryNumber,
            'country' => $country,
        ];
    }

    public static function businessIdentityRules(string $nameField, string $countryField, ?string $emailField = null, ?string $phoneField = null): array
    {
        $rules = [
            $nameField => ['required', 'string', 'max:255'],
            $countryField => ['required', 'string', 'size:2'],
        ];

        if ($emailField !== null) {
            $rules[$emailField] = ['nullable', 'email', 'max:255'];
        }

        if ($phoneField !== null) {
            $rules[$phoneField] = ['nullable', 'string', 'max:20'];
        }

        return $rules;
    }
}