<?php

namespace App\Services;

use App\Repositories\SurveyShareRepository;
use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SurveyShareService
{
    protected $shareRepository;
    protected $auditLogService;

    public function __construct(
        SurveyShareRepository $shareRepository,
        AuditLogService $auditLogService
    ) {
        $this->shareRepository = $shareRepository;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Lấy share theo ID
     */
    public function getShareById($id)
    {
        return $this->shareRepository->findById($id);
    }

    /**
     * Lấy tất cả shares của survey
     */
    public function getSharesBySurveyId($surveyId)
    {
        return $this->shareRepository->getBySurveyId($surveyId);
    }

    /**
     * Lấy thông tin share dựa trên token
     */
    public function getShareByToken(string $token)
    {
        // Validate token format (defense in depth - also validated in resolver)
        $token = trim($token);
        
        if (empty($token)) {
            throw new \Exception('Vui lòng nhập mã token');
        }
        
        if (strlen($token) < 4) {
            throw new \Exception('Mã token phải có ít nhất 4 ký tự');
        }
        
        if (strlen($token) > 100) {
            throw new \Exception('Mã token không được vượt quá 100 ký tự');
        }
        
        if (!preg_match('/^[a-zA-Z0-9\-_]+$/', $token)) {
            throw new \Exception('Mã token chỉ được chứa chữ cái, số và các ký tự: - _');
        }
        
        try {
            $share = $this->shareRepository->findByToken($token);
            
            // Load survey with trashed to check if it's deleted
            $survey = \App\Models\Survey::withTrashed()->find($share->survey_id);
            
            // Check if survey exists
            if (!$survey) {
                throw new \Exception('Khảo sát không tồn tại hoặc đã bị xóa');
            }
            
            // Check if survey is soft-deleted
            if ($survey->trashed()) {
                throw new \Exception('Khảo sát đã bị xóa');
            }
            
            // Check if survey is closed
            if ($survey->status === 'closed') {
                throw new \Exception('Khảo sát đã đóng và không còn nhận phản hồi');
            }
            
            // Reload share with survey relationship for normal response
            return $share->load('survey');
        } catch (ModelNotFoundException $e) {
            throw new \Exception('Token không hợp lệ hoặc đã hết hạn');
        } catch (\Exception $e) {
            // Re-throw if it's already a meaningful error message
            if (strpos($e->getMessage(), 'Khảo sát') !== false || 
                strpos($e->getMessage(), 'Token') !== false) {
                throw $e;
            }
            // Otherwise, wrap in generic error
            throw new \Exception('Token không hợp lệ hoặc đã hết hạn');
        }
    }

    /**
     * Tạo hoặc lấy link chia sẻ công khai
     */
    public function getPublicShareLink($surveyId, $userId)
    {
        try {
            $share = $this->shareRepository->getOrCreatePublicShare($surveyId, $userId);

            // Ghi audit log nếu tạo mới
            if ($share->wasRecentlyCreated) {
                $this->auditLogService->log(
                    $surveyId,
                    'create',
                    'share',
                    $share->id,
                    "Tạo link chia sẻ công khai"
                );
            }

            return $share;
        } catch (\Exception $e) {
            Log::error('Error getting public share link: ' . $e->getMessage());
            throw new \Exception('Không thể tạo link chia sẻ: ' . $e->getMessage());
        }
    }

    /**
     * Mời người dùng qua email
     */
    public function inviteByEmail($surveyId, $email, $userId)
    {
        try {
            // Kiểm tra xem đã mời email này chưa
            $existingShare = \App\Models\SurveyShare::where('survey_id', $surveyId)
                ->where('email', $email)
                ->where('share_type', 'email')
                ->first();

            if ($existingShare) {
                throw new \Exception('Email này đã được mời trước đó');
            }

            // Tạo share mới
            $share = $this->shareRepository->create([
                'survey_id' => $surveyId,
                'share_type' => 'email',
                'email' => $email,
                'status' => 'pending',
                'sent_at' => now(),
                'created_by' => $userId,
            ]);

            // TODO: Gửi email mời
            // Mail::to($email)->send(new SurveyInvitation($share));

            // Ghi audit log
            $this->auditLogService->log(
                $surveyId,
                'create',
                'share',
                $share->id,
                "Mời người dùng qua email: {$email}"
            );

            return $share;
        } catch (\Exception $e) {
            Log::error('Error inviting by email: ' . $e->getMessage());
            throw new \Exception('Không thể gửi lời mời: ' . $e->getMessage());
        }
    }

    /**
     * Chia sẻ cho nhóm
     */
    public function shareToGroup($surveyId, $groupId, $userId)
    {
        try {
            // Kiểm tra xem đã chia sẻ cho nhóm này chưa
            $existingShare = \App\Models\SurveyShare::where('survey_id', $surveyId)
                ->where('group_id', $groupId)
                ->where('share_type', 'group')
                ->first();

            if ($existingShare) {
                throw new \Exception('Đã chia sẻ cho nhóm này trước đó');
            }

            // Tạo share mới
            $share = $this->shareRepository->create([
                'survey_id' => $surveyId,
                'share_type' => 'group',
                'group_id' => $groupId,
                'status' => 'pending',
                'sent_at' => now(),
                'created_by' => $userId,
            ]);

            // Ghi audit log
            $this->auditLogService->log(
                $surveyId,
                'create',
                'share',
                $share->id,
                "Chia sẻ cho nhóm ID: {$groupId}"
            );

            return $share;
        } catch (\Exception $e) {
            Log::error('Error sharing to group: ' . $e->getMessage());
            throw new \Exception('Không thể chia sẻ cho nhóm: ' . $e->getMessage());
        }
    }

    /**
     * Xóa share
     */
    public function deleteShare($id)
    {
        try {
            $share = $this->shareRepository->findById($id);
            $surveyId = $share->survey_id;
            $shareType = $share->share_type;

            $this->shareRepository->delete($id);

            // Ghi audit log
            $this->auditLogService->log(
                $surveyId,
                'delete',
                'share',
                $id,
                "Xóa chia sẻ: {$shareType}"
            );

            return true;
        } catch (\Exception $e) {
            Log::error('Error deleting share: ' . $e->getMessage());
            throw new \Exception('Không thể xóa chia sẻ: ' . $e->getMessage());
        }
    }

    /**
     * Đánh dấu share đã hoàn thành
     */
    public function markAsCompleted($id)
    {
        try {
            return $this->shareRepository->markAsCompleted($id);
        } catch (\Exception $e) {
            Log::error('Error marking share as completed: ' . $e->getMessage());
            throw new \Exception('Không thể cập nhật trạng thái: ' . $e->getMessage());
        }
    }
}
