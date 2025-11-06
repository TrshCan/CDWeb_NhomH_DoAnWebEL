// src/api/graphql/survey.js
import graphqlClient from "./client";

export async function getSurveysMadeByUser(createdBy) {
  const query = `
    query ($createdBy: Int!) {
      surveysMade(createdBy: $createdBy) {
        id
        title
        created_at
        end_at
        status
        responses
      }
    }
  `;
  const response = await graphqlClient.post("", { query, variables: { createdBy } });
  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }
  return response.data.data.surveysMade;
}

export async function getSurveysCompletedByUser(userId) {
  const query = `
    query ($userId: Int!) {
      surveysCompleted(userId: $userId) {
        id
        name
        creator
        completedAt
        canView
      }
    }
  `;
  const response = await graphqlClient.post("", { query, variables: { userId } });
  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }
  return response.data.data.surveysCompleted;
}


