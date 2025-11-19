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

// Query survey overview data with questions and answer statistics
export async function getSurveyOverview(surveyId) {
  const query = `
    query ($surveyId: Int!) {
      surveyOverview(surveyId: $surveyId) {
        title
        totalResponses
        questions {
          id
          question_text
          question_type
          options {
            id
            option_text
          }
          answer_stats {
            option_text
            count
          }
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

  return response.data.data.surveyOverview;
}

export async function getSurveyResponseDetail(surveyId, responseId) {
  const query = `
    query ($surveyId: Int!, $responseId: String!) {
      surveyResponseDetail(surveyId: $surveyId, responseId: $responseId) {
        responseId
        surveyId
        surveyTitle
        participant {
          name
          studentId
          faculty
          class
          completedAt
        }
        stats {
          completionTime
          answeredQuestions
          totalQuestions
          totalScore
          maxScore
          scorePercentage
        }
        navigation {
          previous
          next
        }
        questions {
          id
          question
          type
          answerText
          score
          points
          options {
            id
            text
            selected
            isCorrect
          }
        }
      }
    }
  `;

  const response = await graphqlClient.post("", {
    query,
    variables: {
      surveyId: parseInt(surveyId, 10),
      responseId,
    },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }

  return response.data.data.surveyResponseDetail;
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
