<?php

namespace App\Exceptions;

use RuntimeException;

class AccountingControlException extends RuntimeException
{
    public function __construct(
        public readonly string $controlId,
        string $message,
    ) {
        parent::__construct($message);
    }
}