import graphqlClient from "./client";

export const sendJoinRequest = async (input) => {
  console.log("Sending join request with:", input);

  const query = `
    mutation ($userId: ID!, $code: String!) {
      sendJoinRequest(userId: $userId, code: $code) {
        success
        message
        joinRequest {
          id
          status
          group {
            id
            name
            code
          }
          user {
            id
            name
          }
        }
      }
    }
  `;

  const variables = {
    userId: input.userId,
    code: input.code,
  };

  try {
    const response = await graphqlClient.post("", { query, variables });
    console.log("Raw response:", response.data);

    if (response.data.errors) {
      throw new Error(response.data.errors[0]?.message || "GraphQL error");
    }

    const result = response.data.data.sendJoinRequest;
    console.log("sendJoinRequest result:", result);
    return result;

  } catch (error) {
    console.error("sendJoinRequest failed:", error);
    throw error;
  }
};