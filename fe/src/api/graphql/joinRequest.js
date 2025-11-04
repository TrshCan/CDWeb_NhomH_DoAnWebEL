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

export const getPendingJoinRequests = async (userId) => {
  console.log("[getPendingJoinRequests] Starting for userId:", userId);

  const query = `
    query ($userId: ID!) {
      pendingJoinRequests(userId: $userId) {
        id
        group {
          id
          name
          code
        }
        status
        created_at
      }
    }
  `;

  const variables = { userId: userId.toString() }; // ensure string
  console.log("[getPendingJoinRequests] Variables:", variables);

  try {
    const response = await graphqlClient.post("", { query, variables });
    console.log("[getPendingJoinRequests] Full response:", response);

    if (response.data.errors) {
      console.error(
        "[getPendingJoinRequests] GraphQL errors:",
        response.data.errors
      );
      throw new Error(response.data.errors[0]?.message || "GraphQL error");
    }

    const result = response.data.data.pendingJoinRequests;
    console.log("[getPendingJoinRequests] Success – data:", result);
    return result;
  } catch (error) {
    console.error("[getPendingJoinRequests] Failed:", error);
    throw error;
  }
};

export const getPendingJoinRequestsByGroup = async (groupId) => {
  const query = `
    query ($groupId: ID!) {
      pendingJoinRequestsByGroup(groupId: $groupId) {
        id
        status
        created_at
        user { id name }
        group { id name }
      }
    }
  `;
  const variables = { groupId: groupId.toString() };
  const response = await graphqlClient.post("", { query, variables });
  if (response.data.errors) throw new Error(response.data.errors[0]?.message || "GraphQL error");
  return response.data.data.pendingJoinRequestsByGroup;
};