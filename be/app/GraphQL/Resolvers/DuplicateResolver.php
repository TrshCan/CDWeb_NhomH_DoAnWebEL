<?php

namespace App\GraphQL\Resolvers;

use App\Services\DuplicateService;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
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
        // Kiểm tra quyền: chỉ admin và lecturer mới có thể sao chép survey
        $user = Auth::user();
        if (!$user) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.',
            ]);
        }

        if (!$user->isAdmin() && !$user->isLecturer()) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền sao chép khảo sát. Chỉ admin và giáo viên mới có quyền này.',
            ]);
        }

        // Lấy ID survey từ arguments
        $surveyId = $args['id'] ?? null;
        if (!$surveyId) {
            throw new Exception("ID khảo sát là bắt buộc.", 400);
        }

        try {
            // Gọi service để sao chép survey
            $duplicatedSurvey = $this->duplicateService->duplicate((int) $surveyId);

            return $duplicatedSurvey;
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
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