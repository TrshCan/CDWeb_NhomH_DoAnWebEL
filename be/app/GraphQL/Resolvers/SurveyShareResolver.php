<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyShareService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SurveyShareResolver
{
    protected $shareService;

    public function __construct(SurveyShareService $shareService)
    {
        $this->shareService = $shareService;
    }

    /**
     * Lấy tất cả shares của survey
     */
    public function getShares($rootValue, array $args)
    {
        return $this->shareService->getSharesBySurveyId($args['survey_id']);
    }

    /**
     * Lấy share dựa trên token
     */
    public function getShareByToken($rootValue, array $args)
    {
        try {
            // Validate token input
            $validator = Validator::make($args, [
                'token' => [
                    'required',
                    'string',
                    'min:4',
                    'max:100',
                    'regex:/^[a-zA-Z0-9\-_]+$/',
                ],
            ], [
                'token.required' => 'Vui lòng nhập mã token',
                'token.string' => 'Mã token phải là chuỗi ký tự',
                'token.min' => 'Mã token phải có ít nhất 4 ký tự',
                'token.max' => 'Mã token không được vượt quá 100 ký tự',
                'token.regex' => 'Mã token chỉ được chứa chữ cái, số và các ký tự: - _',
            ]);

            if ($validator->fails()) {
                throw ValidationException::withMessages($validator->errors()->toArray());
            }

            return $this->shareService->getShareByToken($args['token']);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions with proper format
            throw new \GraphQL\Error\Error(
                $e->validator->errors()->first(),
                null,
                null,
                [],
                null,
                $e
            );
        } catch (\Exception $e) {
            // Re-throw with proper GraphQL error format to ensure message is passed through
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e
            );
        }
    }

    /**
     * Lấy hoặc tạo link chia sẻ công khai
     */
    public function getPublicShareLink($rootValue, array $args)
    {
        $userId = Auth::id();
        return $this->shareService->getPublicShareLink($args['survey_id'], $userId);
    }

    /**
     * Mời người dùng qua email
     */
    public function inviteByEmail($rootValue, array $args)
    {
        $userId = Auth::id();
        return $this->shareService->inviteByEmail(
            $args['survey_id'],
            $args['email'],
            $userId
        );
    }

    /**
     * Chia sẻ cho nhóm
     */
    public function shareToGroup($rootValue, array $args)
    {
        $userId = Auth::id();
        return $this->shareService->shareToGroup(
            $args['survey_id'],
            $args['group_id'],
            $userId
        );
    }

    /**
     * Xóa share
     */
    public function deleteShare($rootValue, array $args)
    {
        return $this->shareService->deleteShare($args['id']);
    }
}
