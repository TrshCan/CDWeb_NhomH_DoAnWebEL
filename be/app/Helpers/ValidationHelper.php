<?php

namespace App\Helpers;

class ValidationHelper
{
    /**
     * Validate ID format và tồn tại
     */
    public static function validateId($id): int
    {
        // Kiểm tra ID có phải số không
        if (!is_numeric($id)) {
            throw new \Exception("ID không hợp lệ. ID phải là số.");
        }

        $id = (int) $id;

        // Kiểm tra ID có hợp lệ không (phải > 0)
        if ($id <= 0) {
            throw new \Exception("ID không hợp lệ. ID phải lớn hơn 0.");
        }

        // Kiểm tra ID không quá lớn (tránh integer overflow)
        if ($id > PHP_INT_MAX) {
            throw new \Exception("ID không hợp lệ. ID quá lớn.");
        }

        return $id;
    }

    /**
     * Sanitize và validate text input
     * Loại bỏ HTML tags, normalize whitespace
     */
    public static function sanitizeText(?string $text, int $maxLength = 255): ?string
    {
        if ($text === null) {
            return null;
        }

        // Loại bỏ HTML tags
        $text = strip_tags($text);

        // Normalize whitespace (chuyển full-width space thành normal space)
        // Full-width space: U+3000 (IDEOGRAPHIC SPACE)
        $text = str_replace(['　', "\xE3\x80\x80"], ' ', $text);

        // Trim và normalize whitespace
        $text = trim($text);
        $text = preg_replace('/\s+/', ' ', $text);

        // Kiểm tra độ dài
        if (mb_strlen($text) > $maxLength) {
            throw new \Exception("Nội dung không được vượt quá {$maxLength} ký tự.");
        }

        return $text;
    }

    /**
     * Validate text không chỉ toàn khoảng trắng
     */
    public static function validateNotOnlyWhitespace(string $text, string $fieldName = 'Trường'): void
    {
        // Loại bỏ tất cả whitespace (bao gồm full-width space)
        // Full-width space: U+3000 (IDEOGRAPHIC SPACE) - sử dụng \x{3000} cho PCRE2
        $trimmed = preg_replace('/[\s　\x{3000}]+/u', '', $text);

        if (empty($trimmed)) {
            throw new \Exception("{$fieldName} không được chỉ chứa khoảng trắng.");
        }
    }

    /**
     * Validate số không phải full-width
     */
    public static function validateNumeric($value, string $fieldName = 'Giá trị'): void
    {
        if ($value === null || $value === '') {
            return;
        }

        // Kiểm tra full-width numbers (０-９)
        if (preg_match('/[０-９]/u', $value)) {
            throw new \Exception("{$fieldName} không được chứa số full-width. Vui lòng nhập số bình thường.");
        }

        // Kiểm tra có phải số không
        if (!is_numeric($value)) {
            throw new \Exception("{$fieldName} phải là số hợp lệ.");
        }
    }

    /**
     * Validate và sanitize title
     */
    public static function sanitizeTitle(?string $title): string
    {
        if (empty($title)) {
            throw new \Exception("Tiêu đề không được để trống.");
        }

        $title = self::sanitizeText($title, 255);
        self::validateNotOnlyWhitespace($title, 'Tiêu đề');

        // Validate regex pattern (chỉ cho phép chữ, số, khoảng trắng, dấu câu tiếng Việt)
        if (!preg_match('/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/u', $title)) {
            throw new \Exception("Tiêu đề chứa ký tự không hợp lệ.");
        }

        return $title;
    }

    /**
     * Validate và sanitize details/description
     */
    public static function sanitizeDetails(?string $details, int $maxLength = 255): ?string
    {
        if (empty($details)) {
            return null;
        }

        $details = self::sanitizeText($details, $maxLength);
        
        // Validate regex pattern
        if (!preg_match('/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/u', $details)) {
            throw new \Exception("Nội dung chứa ký tự không hợp lệ.");
        }

        return $details;
    }

    /**
     * Validate pagination parameters
     */
    public static function validatePagination($perPage, $page): array
    {
        $perPage = self::validateNumericParam($perPage, 5, 1, 100, 'perPage');
        $page = self::validateNumericParam($page, 1, 1, PHP_INT_MAX, 'page');

        return [(int)$perPage, (int)$page];
    }

    /**
     * Validate numeric parameter
     */
    private static function validateNumericParam($value, $default, $min, $max, $paramName): int
    {
        if ($value === null || $value === '') {
            return $default;
        }

        self::validateNumeric($value, $paramName);

        $value = (int) $value;

        if ($value < $min || $value > $max) {
            throw new \Exception("{$paramName} phải từ {$min} đến {$max}.");
        }

        return $value;
    }

    /**
     * Validate date format
     */
    public static function validateDateFormat(string $date, string $format = 'Y-m-d H:i:s'): string
    {
        try {
            $carbon = \Carbon\Carbon::createFromFormat($format, $date);
            return $carbon->format($format);
        } catch (\Exception $e) {
            throw new \Exception("Định dạng ngày tháng không hợp lệ. Định dạng yêu cầu: {$format}.");
        }
    }

    /**
     * Check if string contains HTML
     */
    public static function containsHtml(string $text): bool
    {
        return $text !== strip_tags($text);
    }
}

