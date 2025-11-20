// fe/src/api/surveys.js
import { graphqlRequest } from "./graphql";

/**
 * Lấy danh sách surveys
 */
export const getSurveys = async () => {
  const query = `
    query GetSurveys {
      surveys {
        id
        title
        description
        type
        object
        status
        created_at
        category {
          id
          name
        }
        questions {
          id
          question_text
          question_type
        }
      }
    }
  `;

  const response = await graphqlRequest(query);
  return response.data.surveys;
};

/**
 * Lấy chi tiết survey
 */
export const getSurvey = async (surveyId) => {
  const query = `
    query GetSurvey($id: ID!) {
      survey(id: $id) {
        id
        title
        description
        welcome_title
        welcome_description
        end_title
        end_description
        type
        object
        status
        start_at
        end_at
        created_at
        category {
          id
          name
        }
        creator {
          id
          name
          email
        }
        questionGroups {
          id
          title
          position
          questions {
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
            group_id
            position
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
        questions {
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
          group_id
          position
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
    }
  `;

  const variables = { id: surveyId };
  const response = await graphqlRequest(query, variables);
  return response.data.survey;
};

/**
 * Tạo survey mới
 */
export const createSurvey = async (surveyData) => {
  const mutation = `
    mutation CreateSurvey($input: CreateSurveyInput!) {
      createSurvey(input: $input) {
        id
        title
        description
        type
        object
        status
        categories_id
        created_at
        category {
          id
          name
        }
        creator {
          id
          name
          email
        }
      }
    }
  `;

  const variables = {
    input: surveyData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.createSurvey;
};
/**

 * Cập nhật survey (partial update)
 */
export const updateSurvey = async (surveyId, updateData) => {
  const mutation = `
    mutation UpdateSurvey($id: ID!, $input: UpdateSurveyInput!) {
      updateSurvey(id: $id, input: $input) {
        id
        title
        description
        welcome_title
        welcome_description
        end_title
        end_description
        type
        object
        status
        created_at
      }
    }
  `;

  const variables = {
    id: surveyId,
    input: updateData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.updateSurvey;
};
