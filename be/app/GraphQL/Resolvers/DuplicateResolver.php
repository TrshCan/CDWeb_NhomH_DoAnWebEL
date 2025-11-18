<?php

namespace App\GraphQL\Resolvers;

use App\Services\DuplicateService;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use Exception;

/**
 * Resolver xử lý GraphQL mutation duplicateSurvey
 * 
 * Chức năng: Nhận request từ GraphQL và gọi service để sao chép survey
 */
class DuplicateResolver
{
    protected $duplicateService;

    /**
     * Constructor
     * 
     * @param DuplicateService $duplicateService
     */
    public function __construct(DuplicateService $duplicateService)
    {
        $this->duplicateService = $duplicateService;
    }

    /**
     * Resolver cho mutation duplicateSurvey
     * 
     * @param null $root Root value
     * @param array<string, mixed> $args Arguments từ GraphQL query
     * @param GraphQLContext $context GraphQL context
     * @param ResolveInfo $resolveInfo Resolve info
     * @return \App\Models\Survey Survey đã được sao chép
     * @throws Exception Khi có lỗi xảy ra
     */
    public function duplicateSurvey($root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        // TODO: Kiểm tra đăng nhập - sẽ bật lại sau khi có hệ thống authentication
        /*
        $user = $context->user();
        if (!$user) {
            throw new Exception("Bạn cần đăng nhập để sao chép khảo sát.", 401);
        }
        */

        // Lấy ID survey từ arguments
        $surveyId = $args['id'] ?? null;
        if (!$surveyId) {
            throw new Exception("ID khảo sát là bắt buộc.", 400);
        }

        try {
            // Gọi service để sao chép survey
            $duplicatedSurvey = $this->duplicateService->duplicate((int) $surveyId);

            return $duplicatedSurvey;
        } catch (Exception $e) {
            // Lighthouse sẽ tự động trả về error trong GraphQL response
            throw $e;
        }
    }

    /**
     * Resolver cho query surveys - Lấy danh sách tất cả surveys
     * 
     * @param null $root Root value
     * @param array<string, mixed> $args Arguments từ GraphQL query
     * @param GraphQLContext $context GraphQL context
     * @param ResolveInfo $resolveInfo Resolve info
     * @return \Illuminate\Database\Eloquent\Collection Danh sách surveys
     */
    public function listSurveys($root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        try {
            // Lấy tất cả surveys (chưa bị xóa)
            $surveys = \App\Models\Survey::whereNull('deleted_at')
                ->orderByDesc('created_at')
                ->get();

            return $surveys;
        } catch (Exception $e) {
            \Log::error('List surveys failed', ['error' => $e->getMessage()]);
            throw new Exception("Không thể tải danh sách khảo sát.", 500);
        }
    }
}