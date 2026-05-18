<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Concerns\ProvidesKsaContactFixtures;

abstract class TestCase extends BaseTestCase
{
    use ProvidesKsaContactFixtures;
}
