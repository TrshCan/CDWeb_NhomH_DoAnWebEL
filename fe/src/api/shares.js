// fe/src/api/shares.js
import { graphqlRequest } from "./graphql";

/**
 * Lấy hoặc tạo link chia sẻ công khai
 */
export const getPublicShareLink = async (surveyId) => {
  const query = `
    query GetPublicShareLink($survey_id: ID!) {
      publicShareLink(survey_id: $survey_id) {
        id
        survey_id
        share_type
        share_token
        share_url
        status
        created_at
      }
    }
  `;

  const variables = { survey_id: surveyId };
  const response = await graphqlRequest(query, variables);
  return response.data.publicShareLink;
};

/**
 * Lấy tất cả shares của survey
 */
export const getSurveyShares = async (surveyId) => {
  const query = `
    query GetSurveyShares($survey_id: ID!) {
      surveyShares(survey_id: $survey_id) {
        id
        survey_id
        share_type
        share_token
        email
        group_id
        status
        sent_at
        completed_at
        creator {
          id
          name
        }
        created_at
      }
    }
  `;

  const variables = { survey_id: surveyId };
  const response = await graphqlRequest(query, variables);
  return response.data.surveyShares;
};

/**
 * Mời người dùng qua email
 */
export const inviteByEmail = async (surveyId, email) => {
  const mutation = `
    mutation InviteByEmail($survey_id: ID!, $email: String!) {
      inviteByEmail(survey_id: $survey_id, email: $email) {
        id
        survey_id
        share_type
        email
        status
        sent_at
        created_at
      }
    }
  `;

  const variables = { survey_id: surveyId, email };
  const response = await graphqlRequest(mutation, variables);
  return response.data.inviteByEmail;
};

/**
 * Chia sẻ cho nhóm
 */
export const shareToGroup = async (surveyId, groupId) => {
  const mutation = `
    mutation ShareToGroup($survey_id: ID!, $group_id: ID!) {
      shareToGroup(survey_id: $survey_id, group_id: $group_id) {
        id
        survey_id
        share_type
        group_id
        status
        sent_at
        created_at
      }
    }
  `;

  const variables = { survey_id: surveyId, group_id: groupId };
  const response = await graphqlRequest(mutation, variables);
  return response.data.shareToGroup;
};

/**
 * Xóa share
 */
export const deleteShare = async (shareId) => {
  const mutation = `
    mutation DeleteShare($id: ID!) {
      deleteShare(id: $id)
    }
  `;

  const variables = { id: shareId };
  const response = await graphqlRequest(mutation, variables);
  return response.data.deleteShare;
};

/**
 * Tra cứu thông tin chia sẻ bằng token
 */
export const getSurveyShareByToken = async (token) => {
  const query = `
    query SurveyShareByToken($token: String!) {
      surveyShareByToken(token: $token) {
        id
        survey_id
        share_type
        status
        survey {
          id
          title
          object
          status
        }
      }
    }
  `;

  const variables = { token };
  const response = await graphqlRequest(query, variables);
  return response.data.surveyShareByToken;
};