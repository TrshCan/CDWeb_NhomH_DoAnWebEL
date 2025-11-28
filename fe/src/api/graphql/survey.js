// src/api/graphql/survey.js
import graphqlClient from "./client";

// Query to get current user's profile (including role)
export async function getCurrentUserProfile(userId) {
  const query = `
    query ($userId: Int!) {
      publicProfile(id: $userId) {
        id
        name
        email
        role
      }
    }
  `;

  const response = await graphqlClient.post("", {
    query,
    variables: { userId: parseInt(userId) },
  });

  if (response.data.errors) {
    throw response.data.errors[0];
  }

  return response.data.data.publicProfile;
}

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
export async function getSurveyJoinDetail(surveyId, token) {
  const query = `
    query ($surveyId: Int!, $token: String!) {
      surveyJoinDetail(surveyId: $surveyId, token: $token) {
        id
        title
        description
        status
        object
        start_at
        time_limit
        total_points
        is_accessible_directly
        questions {
          id
          question_text
          question_type
          image
          points
          help_text
          max_length
          required
          conditions
          options {
            id
            option_text
            image
          }
        }
      }
    }
  `;

  try {
    console.log("[API][getSurveyJoinDetail] Request:", {
      surveyId: parseInt(surveyId, 10),
      token: token ? `${token.substring(0, 4)}...` : null,
      tokenLength: token?.length
    });

    const response = await graphqlClient.post("", {
      query,
      variables: { surveyId: parseInt(surveyId, 10), token },
    });

    console.log("[API][getSurveyJoinDetail] Response:", {
      hasData: !!response.data?.data,
      hasErrors: !!response.data?.errors,
      errors: response.data?.errors,
      status: response.status
    });

    // Check for GraphQL errors in response
    if (response.data.errors) {
      const error = response.data.errors[0];
      const errorMessage = error?.message || "GraphQL error";
      const errorObj = new Error(errorMessage);
      
      // Preserve extensions for better error handling
      if (error?.extensions) {
        errorObj.extensions = error.extensions;
      }
      
      throw errorObj;
    }

    // Check if data exists
    if (!response.data.data || !response.data.data.surveyJoinDetail) {
      throw new Error("Survey not found or invalid response from server");
    }

    return response.data.data.surveyJoinDetail;
  } catch (err) {
    // Handle axios errors (network errors, HTTP errors)
    if (err.response) {
      // HTTP error response (4xx, 5xx)
      const status = err.response.status;
      const responseData = err.response.data;
      
      // Check if it's a GraphQL error structure
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const graphQLError = responseData.errors[0];
        const errorMessage = graphQLError?.message || `HTTP ${status} Error`;
        const errorObj = new Error(errorMessage);
        
        if (graphQLError?.extensions) {
          errorObj.extensions = graphQLError.extensions;
        }
        
        throw errorObj;
      }
      
      // Handle non-GraphQL HTTP errors
      const errorMessage = responseData?.message || 
                          responseData?.error || 
                          `Server error (${status})`;
      throw new Error(errorMessage);
    } else if (err.request) {
      // Request was made but no response received (network error)
      throw new Error("Network error. Please check your connection and try again.");
    } else {
      // Something else happened (re-throw the original error)
      throw err;
    }
  }
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
    const errorMessage = response.data.errors[0]?.message || "GraphQL error";
    throw new Error(errorMessage);
  }

  // Check if data exists and has the expected structure
  if (!response.data.data || !response.data.data.submitSurveyAnswers) {
    console.error("[API][submitSurveyAnswers] Invalid response structure", response.data);
    throw new Error("Invalid response from server. Please try again.");
  }

  const result = response.data.data.submitSurveyAnswers;
  
  // Return result regardless of success status - let frontend handle it
  return result;
}

// Get survey details for editing
export async function getSurveyDetails(surveyId) {
  const query = `
    query ($surveyId: Int!) {
      surveyDetails(surveyId: $surveyId) {
        id
        title
        description
        categories_id
        start_at
        end_at
        object
        status
        updated_at
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

  return response.data.data.surveyDetails;
}

// Update survey
export async function updateSurvey(surveyId, input) {
  const mutation = `
    mutation ($id: Int!, $input: UpdateSurveyInput!) {
      updateSurvey(id: $id, input: $input) {
        id
        title
        description
        categories_id
        start_at
        end_at
        object
        status
      }
    }
  `;

  const response = await graphqlClient.post("", {
    query: mutation,
    variables: {
      id: parseInt(surveyId, 10),
      input,
    },
  });

  if (response.data.errors) {
    const error = new Error(response.data.errors[0]?.message || "GraphQL error");
    error.graphQLErrors = response.data.errors;
    throw error;
  }

  return response.data.data.updateSurvey;
}

// Get all categories
export async function getCategories() {
  const query = `
    query {
      categories {
        id
        name
      }
    }
  `;

  const response = await graphqlClient.post("", { query });

  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }

  return response.data.data.categories;
}

// Create survey
export async function createSurvey(input) {
  const mutation = `
    mutation ($input: SurveyInput!) {
      createSurvey(input: $input) {
        title
        description
        categories_id
        type
        start_at
        end_at
        object
        status
        time_limit
        points
        created_by
      }
    }
  `;

  const response = await graphqlClient.post("", {
    query: mutation,
    variables: { input },
  });

  if (response.data.errors) {
    const error = new Error(response.data.errors[0]?.message || "GraphQL error");
    error.graphQLErrors = response.data.errors;
    throw error;
  }

  return response.data.data.createSurvey;
}

// Duplicate survey
export async function duplicateSurvey(surveyId) {
  const mutation = `
    mutation ($id: Int!) {
      duplicateSurvey(id: $id) {
        id
        title
        description
        categories_id
        type
        status
        start_at
        end_at
        time_limit
        points
        object
        created_by
      }
    }
  `;

  const response = await graphqlClient.post("", {
    query: mutation,
    variables: { id: parseInt(surveyId, 10) },
  });

  if (response.data.errors) {
    const error = new Error(response.data.errors[0]?.message || "GraphQL error");
    error.graphQLErrors = response.data.errors;
    throw error;
  }

  return response.data.data.duplicateSurvey;
}

// Delete survey
export async function deleteSurvey(surveyId) {
  const mutation = `
    mutation ($id: Int!) {
      deleteSurvey(id: $id)
    }
  `;

  const response = await graphqlClient.post("", {
    query: mutation,
    variables: { id: parseInt(surveyId, 10) },
  });

  if (response.data.errors) {
    const error = new Error(response.data.errors[0]?.message || "GraphQL error");
    error.graphQLErrors = response.data.errors;
    throw error;
  }

  return response.data.data.deleteSurvey;
}