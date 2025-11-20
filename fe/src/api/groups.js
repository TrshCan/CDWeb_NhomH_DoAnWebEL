// fe/src/api/groups.js
import { graphqlRequest } from "./graphql";

/**
 * Tạo question group mới
 */
export const createQuestionGroup = async (groupData) => {
  const mutation = `
    mutation CreateQuestionGroup($input: CreateQuestionGroupInput!) {
      createQuestionGroup(input: $input) {
        id
        survey_id
        title
        position
        questions {
          id
          question_text
          help_text
          question_type
          group_id
          position
          options {
            id
            option_text
            image
            is_subquestion
            position
          }
        }
      }
    }
  `;

  const variables = {
    input: groupData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.createQuestionGroup;
};

/**
 * Cập nhật question group
 */
export const updateQuestionGroup = async (groupId, updateData) => {
  const mutation = `
    mutation UpdateQuestionGroup($id: ID!, $input: UpdateQuestionGroupInput!) {
      updateQuestionGroup(id: $id, input: $input) {
        id
        title
        position
      }
    }
  `;

  const variables = {
    id: groupId,
    input: updateData,
  };

  const response = await graphqlRequest(mutation, variables);
  return response.data.updateQuestionGroup;
};

/**
 * Xóa question group
 */
export const deleteQuestionGroup = async (groupId) => {
  const mutation = `
    mutation DeleteQuestionGroup($id: ID!) {
      deleteQuestionGroup(id: $id)
    }
  `;

  const variables = { id: groupId };
  const response = await graphqlRequest(mutation, variables);
  return response.data.deleteQuestionGroup;
};

/**
 * Duplicate question group (sao chép group và tất cả questions)
 */
export const duplicateQuestionGroup = async (groupId) => {
  const mutation = `
    mutation DuplicateQuestionGroup($id: ID!) {
      duplicateQuestionGroup(id: $id) {
        id
        survey_id
        title
        position
        questions {
          id
          question_code
          question_text
          help_text
          question_type
          required
          image
          conditions
          max_length
          numeric_only
          max_questions
          allowed_file_types
          max_file_size_kb
          points
          default_scenario
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

  const variables = { id: groupId };
  const response = await graphqlRequest(mutation, variables);
  return response.data.duplicateQuestionGroup;
};
