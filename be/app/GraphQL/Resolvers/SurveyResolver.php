<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyService;
use App\Models\Survey;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use Illuminate\Validation\ValidationException;

class SurveyResolver
{
    protected $service;

    public function __construct(SurveyService $service)
    {
        $this->service = $service;
    }
    public function list($_, array $args)
    {
        $perPage = $args['per_page'] ?? 5;
        return $this->service->getAllSurveys($perPage);
    }
    /**
     * ✏️ Cập nhật khảo sát
     */
    /**
     * ✏️ Cập nhật khảo sát
     */
    public function updateSurvey($root, array $args)
    {
        try {
            $id = $args['id'];
            $input = $args['input'];

            // Gọi service để xử lý cập nhật
            $updatedSurvey = $this->service->updateSurvey($id, $input);

            return $updatedSurvey;
        } catch (ValidationException $e) {
            throw new \Nuwave\Lighthouse\Exceptions\ValidationException(
                'Validation failed.',
                $e->validator
            );
        } catch (\Exception $e) {
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e,
                ['category' => $e->getCode() === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR']
            );
        }
    }



    public function createSurvey($root, array $args, GraphQLContext $context): Survey
    {
        try {
            $data = [
                'title' => $args['input']['title'],
                'description' => $args['input']['description'] ?? null,
                'categories_id' => $args['input']['categories_id'],
                'type' => $args['input']['type'] ?? null,
                'start_at' => $args['input']['start_at'] ?? null,
                'end_at' => $args['input']['end_at'] ?? null,
                'time_limit' => $args['input']['time_limit'] ?? null,
                'points' => $args['input']['points'] ?? null,
                'object' => $args['input']['object'] ?? null,
                'created_by' => $args['input']['created_by'],
                'status' => $args['input']['status'] ?? 'active', // ✅ thêm dòng này
            ];


            return $this->service->createSurvey($data);
        } catch (ValidationException $e) {
            throw new \Nuwave\Lighthouse\Exceptions\ValidationException(
                'Validation failed.',
                $e->validator
            );
        } catch (\Exception $e) {
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e,
                ['category' => $e->getCode() === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR']
            );
        }
    }
    public function deleteSurvey($_, array $args)
    {
        return $this->service->deleteSurvey($args['id']);
    }
    /**
     * 🔍 Xem chi tiết khảo sát theo ID
     */
    public function getSurveyById($root, array $args)
    {
        try {
            $id = $args['id'];
            return $this->service->getSurveyById($id);
        } catch (\Exception $e) {
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e,
                ['category' => $e->getCode() === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR']
            );
        }
    }
}