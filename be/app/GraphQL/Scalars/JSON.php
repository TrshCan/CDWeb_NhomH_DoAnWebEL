<?php

namespace App\GraphQL\Scalars;

use GraphQL\Error\Error;
use GraphQL\Language\AST\Node;
use GraphQL\Type\Definition\ScalarType;

class JSON extends ScalarType
{
    public string $name = 'JSON';
    public ?string $description = 'The `JSON` scalar type represents JSON values as specified by ECMA-404';

    /**
     * Serialize an internal value to include in a response.
     */
    public function serialize($value): mixed
    {
        return $value;
    }

    /**
     * Parse an externally provided value (query variable) to use as an input.
     */
    public function parseValue($value): mixed
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Error('Cannot represent value as JSON: ' . json_last_error_msg());
            }
            return $decoded;
        }

        return $value;
    }

    /**
     * Parse an externally provided literal value (hardcoded in GraphQL query) to use as an input.
     */
    public function parseLiteral(Node $valueNode, ?array $variables = null): mixed
    {
        // Implement if needed
        return $this->parseValue($valueNode->value);
    }
}
