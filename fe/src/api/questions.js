// fe/src/api/questions.js
import { graphqlRequest } from "./graphql";

/**
 * Thêm câu hỏi mới vào survey
 */
export const addQuestion = async (questionData) => {
  const mutation = `
    mutation AddQuestion($input: CreateQuestionInput!) {
      addQuestion(input: $input) {
        id
        question_code
        question_text
        question_type
        required
        image
        conditions
        max_length
        numeric_only
        max_questions
        allowed_file_types
        max_file_size_kb
        help_text
        points
        survey {
          id
          title
        }
      }
    }
  `;

  const variables = {
    input: questionData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.addQuestion;
};

/**
 * Lấy chi tiết câu hỏi
 */
export const getQuestion = async (questionId) => {
  const query = `
    query GetQuestion($id: ID!) {
      question(id: $id) {
        id
        question_code
        question_text
        question_type
        required
        image
        conditions
        max_length
        numeric_only
        max_questions
        allowed_file_types
        max_file_size_kb
        help_text
        points
        options {
          id
          option_text
          image
          is_subquestion
          position
          is_correct
        }
      }
    }
  `;

  const variables = { id: questionId };
  const response = await graphqlRequest(query, variables);
  return response.data.question;
};

/**
 * Xóa câu hỏi
 */
export const deleteQuestion = async (questionId) => {
  const mutation = `
    mutation DeleteQuestion($id: ID!) {
      deleteQuestion(id: $id)
    }
  `;

  const variables = { id: questionId };
  const response = await graphqlRequest(mutation, variables);
  return response.data.deleteQuestion;
};

/**
 * Xóa nhiều câu hỏi cùng lúc (batch delete) - Tối ưu hơn
 */
export const deleteQuestions = async (questionIds) => {
  if (!questionIds || questionIds.length === 0) {
    return true;
  }

  const mutation = `
    mutation DeleteQuestions($ids: [ID!]!) {
      deleteQuestions(ids: $ids)
    }
  `;

  const variables = { ids: questionIds };
  const response = await graphqlRequest(mutation, variables);
  return response.data.deleteQuestions;
};

/**
 * Cập nhật câu hỏi (partial update - chỉ cập nhật các field được truyền vào)
 */
export const updateQuestion = async (questionId, updateData) => {
  const mutation = `
    mutation UpdateQuestion($id: ID!, $input: UpdateQuestionInput!) {
      updateQuestion(id: $id, input: $input) {
        id
        question_code
        question_text
        question_type
        required
        image
        conditions
        max_length
        numeric_only
        max_questions
        allowed_file_types
        max_file_size_kb
        help_text
        points
      }
    }
  `;

  const variables = {
    id: questionId,
    input: updateData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.updateQuestion;
};

/**
 * Tạo option mới
 */
export const addOption = async (optionData) => {
  const mutation = `
    mutation AddOption($input: CreateOptionInput!) {
      addOption(input: $input) {
        id
        question_id
        option_text
        image
        is_subquestion
        position
        is_correct
      }
    }
  `;

  const variables = {
    input: optionData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.addOption;
};

/**
 * Cập nhật option (partial update - chỉ cập nhật các field được truyền vào)
 */
export const updateOption = async (optionId, updateData) => {
  const mutation = `
    mutation UpdateOption($id: ID!, $input: UpdateOptionInput!) {
      updateOption(id: $id, input: $input) {
        id
        option_text
        image
        is_subquestion
        position
        is_correct
      }
    }
  `;

  const variables = {
    id: optionId,
    input: updateData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.updateOption;
};

/**
 * Xóa option
 */
export const deleteOption = async (optionId) => {
  const mutation = `
    mutation DeleteOption($id: ID!) {
      deleteOption(id: $id)
    }
  `;

  const variables = { id: optionId };
  const response = await graphqlRequest(mutation, variables);
  return response.data.deleteOption;
};

/**
 * Duplicate câu hỏi (sao chép câu hỏi và tất cả options)
 */
export const duplicateQuestion = async (questionId) => {
  const mutation = `
    mutation DuplicateQuestion($id: ID!) {
      duplicateQuestion(id: $id) {
        id
        question_code
        question_text
        question_type
        required
        image
        conditions
        max_length
        numeric_only
        max_questions
        allowed_file_types
        max_file_size_kb
        help_text
        points
        default_scenario
        options {
          id
          option_text
          image
          is_subquestion
          position
          is_correct
        }
      }
    }
  `;

  const variables = { id: questionId };
  const response = await graphqlRequest(mutation, variables);
  return response.data.duplicateQuestion;
};