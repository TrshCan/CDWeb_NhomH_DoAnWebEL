<?php

namespace App\GraphQL\Scalars;

use GraphQL\Language\AST\Node;
use GraphQL\Type\Definition\ScalarType;

class DateTime extends ScalarType
{
    public string $name = 'DateTime';
    public ?string $description = 'A datetime string with format `Y-m-d H:i:s`, e.g. `2018-05-23 13:43:32`.';

    public function serialize($value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        return $value;
    }

    public function parseValue($value): ?\DateTimeInterface
    {
        if ($value instanceof \DateTimeInterface) {
            return $value;
        }

        try {
            return new \DateTime($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function parseLiteral(Node $valueNode, ?array $variables = null): ?\DateTimeInterface
    {
        return $this->parseValue($valueNode->value);
    }
}
