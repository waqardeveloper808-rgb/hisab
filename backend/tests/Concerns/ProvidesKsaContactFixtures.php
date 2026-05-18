<?php

namespace Tests\Concerns;

trait ProvidesKsaContactFixtures
{
    protected function ksaBillingAddress(): array
    {
        return [
            'building_number' => '7421',
            'street_name' => 'King Fahd Road',
            'district' => 'Al Olaya',
            'city' => 'Riyadh',
            'postal_code' => '12214',
            'secondary_number' => '3184',
            'country' => 'SA',
        ];
    }

    protected function ksaContactExtras(): array
    {
        return [
            'billing_address' => $this->ksaBillingAddress(),
        ];
    }

    /** 15-digit KSA VAT: leading 3, trailing 3, numeric only. */
    protected function uniqueKsaVatNumber(string $salt): string
    {
        $middle = str_pad((string) (abs(crc32($salt)) % 10000000000000), 13, '0', STR_PAD_LEFT);

        return '3'.$middle.'3';
    }
}
