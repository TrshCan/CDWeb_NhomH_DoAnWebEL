// src/api/graphql/survey.js
import graphqlClient from "./client";

// Query surveys created by a specific user
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

  const response = await graphqlClient.post("", {
    query,
    variables: { createdBy },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }

  return response.data.data.surveysMade;
}

// Query raw data for a specific survey
export async function getSurveyRawData(surveyId) {
  const query = `
    query ($surveyId: Int!) {
      surveyRawData(surveyId: $surveyId) {
        title
        responses {
          id
          studentId
          studentName
          khoa
          completedDate
        }
      }
    }
  `;

  const response = await graphqlClient.post("", {
    query,
    variables: { surveyId: parseInt(surveyId) },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }

  return response.data.data.surveyRawData;
}


