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
