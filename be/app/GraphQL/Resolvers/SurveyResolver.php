<?php

namespace App\GraphQL\Resolvers;

use App\Models\Survey;
use Illuminate\Support\Facades\Auth;

class SurveyResolver
{
    /**
     * Lấy danh sách surveys
     */
    public function list($rootValue, array $args)
    {
        $query = Survey::with(['category', 'creator', 'questions.options']);
        
        // Filter theo status
        if (isset($args['status'])) {
            $query->where('status', $args['status']);
        }
        
        // Filter theo object
        if (isset($args['object'])) {
            $query->where('object', $args['object']);
        }
        
        return $query->get();
    }
    
    /**
     * Lấy chi tiết survey
     */
    public function find($rootValue, array $args)
    {
        $survey = Survey::with(['category', 'creator', 'questions.options'])
            ->findOrFail($args['id']);
        
        return $survey;
    }
    
    /**
     * Tạo survey mới
     */
    public function create($rootValue, array $args)
    {
        $input = $args['input'];
        
        // Set giá trị mặc định
        $input['type'] = $input['type'] ?? 'survey';
        $input['object'] = $input['object'] ?? 'public';
        $input['status'] = $input['status'] ?? 'pending';
        $input['points'] = $input['points'] ?? 0;
        $input['allow_review'] = $input['allow_review'] ?? false;
        
        // Set created_by (tạm thời hardcode, sau này dùng Auth)
        $input['created_by'] = Auth::id() ?? 1;
        
        $survey = Survey::create($input);
        
        // Load relationships
        $survey->load(['category', 'creator', 'questions.options']);
        
        return $survey;
    }
    
    /**
     * Lấy survey cho người tham gia (public access)
     */
    public function forParticipant($rootValue, array $args)
    {
        $survey = Survey::with(['questions.options'])
            ->where('status', 'active')
            ->findOrFail($args['id']);
        
        return $survey;
    }
}
