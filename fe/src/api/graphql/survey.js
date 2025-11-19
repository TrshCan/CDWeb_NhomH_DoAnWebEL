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
  
// Query survey details for joining/taking the survey
export async function getSurveyJoinDetail(surveyId) {
  const query = `
    query ($surveyId: Int!) {
      surveyJoinDetail(surveyId: $surveyId) {
        id
        title
        description
        time_limit
        total_points
        questions {
          id
          question_text
          question_type
          points
          options {
            id
            option_text
          }
        }
      }
    }
  `;

  const response = await graphqlClient.post("", {
    query,
    variables: { surveyId: parseInt(surveyId, 10) },
  });

  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }

  return response.data.data.surveyJoinDetail;
}

// Submit survey answers
export async function submitSurveyAnswers(surveyId, answers) {
  const mutation = `
    mutation ($surveyId: Int!, $answers: [SurveyAnswerInput!]!) {
      submitSurveyAnswers(surveyId: $surveyId, answers: $answers) {
        success
        message
        total_score
        max_score
        score_percentage
      }
    }
  `;

  console.log("[API][submitSurveyAnswers] Sending request", {
    surveyId,
    parsedSurveyId: parseInt(surveyId, 10),
    answers,
  });

  const response = await graphqlClient.post("", {
    query: mutation,
    variables: {
      surveyId: parseInt(surveyId, 10),
      answers,
    },
  });

  console.log("[API][submitSurveyAnswers] Raw response", response);

  if (response.data.errors) {
    console.error("[API][submitSurveyAnswers] GraphQL errors", response.data.errors);
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }

  return response.data.data.submitSurveyAnswers;
}
