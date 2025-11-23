<?php

namespace App\Repositories;

use App\Models\SurveyShare;

class SurveyShareRepository
{
    /**
     * Tìm share theo ID
     */
    public function findById($id)
    {
        return SurveyShare::with(['survey', 'creator'])->findOrFail($id);
    }

    /**
     * Tìm share theo token
     */
    public function findByToken($token)
    {
        return SurveyShare::where('share_token', $token)->firstOrFail();
    }

    /**
     * Lấy tất cả shares của survey
     */
    public function getBySurveyId($surveyId)
    {
        return SurveyShare::where('survey_id', $surveyId)
            ->with(['creator'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Tạo share mới
     */
    public function create(array $data)
    {
        // Tự động tạo token nếu chưa có
        if (!isset($data['share_token']) && $data['share_type'] !== 'group') {
            $data['share_token'] = SurveyShare::generateToken();
        }

        return SurveyShare::create($data);
    }

    /**
     * Cập nhật share
     */
    public function update($id, array $data)
    {
        $share = SurveyShare::findOrFail($id);
        $share->update($data);
        return $share->fresh(['survey', 'creator']);
    }

    /**
     * Xóa share
     */
    public function delete($id)
    {
        $share = SurveyShare::findOrFail($id);
        return $share->delete();
    }

    /**
     * Đánh dấu share đã hoàn thành
     */
    public function markAsCompleted($id)
    {
        $share = SurveyShare::findOrFail($id);
        $share->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
        return $share;
    }

    /**
     * Lấy share public của survey
     */
    public function getPublicShare($surveyId)
    {
        return SurveyShare::where('survey_id', $surveyId)
            ->where('share_type', 'public')
            ->first();
    }

    /**
     * Tạo hoặc lấy share public
     */
    public function getOrCreatePublicShare($surveyId, $userId)
    {
        $share = $this->getPublicShare($surveyId);

        if (!$share) {
            $share = $this->create([
                'survey_id' => $surveyId,
                'share_type' => 'public',
                'share_token' => SurveyShare::generateToken(),
                'created_by' => $userId,
            ]);
        }

        return $share;
    }
}
