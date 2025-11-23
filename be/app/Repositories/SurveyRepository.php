<?php

namespace App\Repositories;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SurveyRepository
{
    public function getByCreatorWithResponseCounts(int $createdBy)
    {
        // Count answers joined through questions per survey
        return Survey::query()
            ->select([
                'surveys.id',
                'surveys.title',
                'surveys.created_at',
                'surveys.end_at',
                'surveys.status',
                DB::raw('COALESCE(COUNT(survey_answers.id), 0) as responses'),
            ])
            ->leftJoin('survey_questions', 'survey_questions.survey_id', '=', 'surveys.id')
            ->leftJoin('survey_answers', 'survey_answers.question_id', '=', 'survey_questions.id')
            ->where('surveys.created_by', $createdBy)
            ->groupBy('surveys.id', 'surveys.title', 'surveys.created_at', 'surveys.end_at', 'surveys.status')
            ->orderByDesc('surveys.created_at')
            ->get();
    }

    public function getRawDataBySurveyId(int $surveyId)
    {
        // Get unique responses per user for a survey
        // Group by user_id to get one response per user
        // Join with users and faculties to get user info
        return DB::table('survey_answers')
            ->select([
                'users.id as user_id',
                'users.student_code',
                'users.name as student_name',
                'users.email as student_email',
                'faculties.name as faculty_name',
                'faculties.code as faculty_code',
                'survey_questions.survey_id',
                DB::raw('MAX(survey_answers.answered_at) as completed_date'),
                DB::raw('CONCAT(survey_questions.survey_id, "-", survey_answers.user_id) as response_id'),
            ])
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_answers.question_id')
            ->join('users', 'users.id', '=', 'survey_answers.user_id')
            ->leftJoin('faculties', 'faculties.id', '=', 'users.faculty_id')
            ->where('survey_questions.survey_id', $surveyId)
            ->whereNull('survey_answers.deleted_at')
            ->groupBy('users.id', 'users.student_code', 'users.name', 'users.email', 'faculties.name', 'faculties.code', 'survey_questions.survey_id')
            ->orderByDesc('completed_date')
            ->get();
    }

    public function getSurveyTitle(int $surveyId)
    {
        return Survey::query()
            ->where('id', $surveyId)
            ->value('title');
    }

    public function getSurveyOverviewData(int $surveyId)
    {
        // Get all questions for the survey with their options
        $questions = DB::table('survey_questions')
            ->where('survey_id', $surveyId)
            ->orderBy('id')
            ->get();

        $questionsData = [];

        foreach ($questions as $question) {
            // Get options for this question
            $options = DB::table('survey_options')
                ->where('question_id', $question->id)
                ->orderBy('id')
                ->get();

            // Get answer statistics
            $answerStats = [];
            
            if ($question->question_type === 'single_choice' || $question->question_type === 'multiple_choice') {
                // Count answers by option
                foreach ($options as $option) {
                    $count = DB::table('survey_answers')
                        ->where('question_id', $question->id)
                        ->where('selected_option_id', $option->id)
                        ->whereNull('deleted_at')
                        ->count();
                    
                    $answerStats[] = [
                        'option_text' => $option->option_text,
                        'count' => $count,
                    ];
                }
            } else if ($question->question_type === 'text') {
                // Get all text answers and process them into word counts
                $textAnswers = DB::table('survey_answers')
                    ->where('question_id', $question->id)
                    ->whereNotNull('answer_text')
                    ->whereNull('deleted_at')
                    ->select('answer_text')
                    ->limit(1000)
                    ->get()
                    ->pluck('answer_text')
                    ->toArray();
                
                // Process text answers into word frequency
                $wordCounts = [];
                foreach ($textAnswers as $text) {
                    if (empty($text)) continue;
                    
                    // Split by common delimiters and extract words
                    $words = preg_split('/[\s,\.;:!?\-\(\)\[\]]+/', strtolower(trim($text)));
                    foreach ($words as $word) {
                        $word = trim($word);
                        if (strlen($word) >= 2) { // Only words with 2+ characters
                            $wordCounts[$word] = ($wordCounts[$word] ?? 0) + 1;
                        }
                    }
                }
                
                // Sort by frequency and take top words
                arsort($wordCounts);
                $answerStats = [];
                foreach (array_slice($wordCounts, 0, 20, true) as $word => $count) {
                    $answerStats[] = [
                        'option_text' => ucfirst($word),
                        'count' => $count,
                    ];
                }
            }

            $questionsData[] = [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'options' => $options->map(function ($opt) {
                    return [
                        'id' => $opt->id,
                        'option_text' => $opt->option_text,
                    ];
                })->toArray(),
                'answer_stats' => $answerStats,
            ];
        }

        return $questionsData;
    }

    public function findSurveyWithQuestions(int $surveyId): ?Survey
    {
        return Survey::query()
            ->with(['questions' => function ($query) {
                $query->orderBy('id')
                    ->with(['options' => function ($optionQuery) {
                        $optionQuery->orderBy('id');
                    }]);
            }])
            ->find($surveyId);
    }

    public function getAnswersForSurveyAndUser(int $surveyId, int $userId): Collection
    {
        return SurveyAnswer::query()
            ->where('user_id', $userId)
            ->whereIn('question_id', function ($query) use ($surveyId) {
                $query->select('id')
                    ->from('survey_questions')
                    ->where('survey_id', $surveyId);
            })
            ->with('selectedOption')
            ->orderBy('question_id')
            ->get();
    }

    public function getParticipantProfile(int $userId): ?object
    {
        return DB::table('users')
            ->select([
                'users.id',
                'users.name',
                'users.student_code',
                'users.email',
                'classes.name as class_name',
                'faculties.name as faculty_name',
            ])
            ->leftJoin('classes', 'classes.id', '=', 'users.class_id')
            ->leftJoin('faculties', 'faculties.id', '=', 'users.faculty_id')
            ->where('users.id', $userId)
            ->first();
    }

    public function getResponseIdsForSurvey(int $surveyId): array
    {
        return DB::table('survey_answers')
            ->selectRaw('CONCAT(survey_questions.survey_id, "-", survey_answers.user_id) as response_id')
            ->selectRaw('MAX(survey_answers.answered_at) as completed_at')
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_answers.question_id')
            ->where('survey_questions.survey_id', $surveyId)
            ->whereNull('survey_answers.deleted_at')
            ->groupBy('survey_answers.user_id', 'survey_questions.survey_id')
            ->orderByDesc('completed_at')
            ->pluck('response_id')
            ->toArray();
    }

    public function getCompletedByUser(int $userId)
    {
        // Distinct surveys that user answered any question on
        return Survey::query()
            ->select([
                'surveys.id',
                'surveys.title as name',
                DB::raw('MAX(survey_answers.answered_at) as completedAt'),
                DB::raw('users.name as creator'),
                'surveys.object',
            ])
            ->join('survey_questions', 'survey_questions.survey_id', '=', 'surveys.id')
            ->join('survey_answers', function ($join) use ($userId) {
                $join->on('survey_answers.question_id', '=', 'survey_questions.id')
                    ->where('survey_answers.user_id', '=', $userId);
            })
            ->leftJoin('users', 'users.id', '=', 'surveys.created_by')
            ->groupBy('surveys.id', 'surveys.title', 'users.name', 'surveys.object')
            ->orderByDesc(DB::raw('MAX(survey_answers.answered_at)'))
            ->get();
    }

    public function create(array $data): Survey
    {
        // Validation đã được xử lý ở SurveyService, nên chỉ tạo record
        return Survey::create($data);
    }

    // 🆕 Cập nhật khảo sát
    public function update(Survey $survey, array $data): Survey
    {
        $survey->update($data);
        return $survey->fresh(); // đảm bảo return bản ghi mới nhất
    }
    
    // 🆕 Thêm hàm lấy danh sách khảo sát (có phân trang và filter)
    public function getAllPaginated(int $perPage = 10, array $filters = [])
    {
        $query = Survey::with(['creator'])
            ->whereNull('surveys.deleted_at');

        // Áp dụng filters
        if (!empty($filters['categories_id'])) {
            $query->where('categories_id', $filters['categories_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = '%' . $filters['keyword'] . '%';
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', $keyword)
                  ->orWhere('description', 'like', $keyword);
            });
        }

        if (!empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (!empty($filters['creator_name'])) {
            $name = '%' . $filters['creator_name'] . '%';
            $query->whereHas('creator', function ($q) use ($name) {
                $q->where('name', 'like', $name);
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate($perPage);
        
        // Set creator_name cho từng survey trong collection
        $paginator->getCollection()->transform(function ($survey) {
            if ($survey->creator) {
                $survey->setAttribute('creator_name', $survey->creator->name);
            }
            return $survey;
        });
        
        return $paginator;
    }
    public function findById(int $id): ?Survey
    {
        return Survey::find($id);
    }

    /**
     * Tìm survey đã bị soft delete
     */
    public function findDeletedById(int $id): ?Survey
    {
        return Survey::onlyTrashed()->find($id);
    }

    /**
     * Lấy survey với creator_name
     */
    public function findWithCreatorName(int $id): ?Survey
    {
        // Sử dụng relationship thay vì join để đảm bảo đúng
        $survey = Survey::with('creator')->find($id);
        
        if ($survey && $survey->creator) {
            // Set creator_name vào attributes để resolver có thể sử dụng
            $survey->setAttribute('creator_name', $survey->creator->name);
        }
        
        return $survey;
    }

    /**
     * Lấy survey sau khi create/update với creator_name
     */
    public function findWithCreatorNameAfterSave(int $id): ?Survey
    {
        $survey = Survey::with('creator')->find($id);
        
        if ($survey && $survey->creator) {
            // Set creator_name vào attributes để resolver có thể sử dụng
            $survey->setAttribute('creator_name', $survey->creator->name);
        }
        
        return $survey;
    }
}