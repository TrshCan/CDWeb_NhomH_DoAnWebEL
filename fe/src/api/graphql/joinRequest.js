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

export const approveJoinRequest = async (id) => {
  const query = `
    mutation ($id: ID!) {
      approveJoinRequest(id: $id) {
        id
        status
        user { id name }
        group { id name }
      }
    }
  `;
  const variables = { id: id.toString() };
  try {
    const response = await graphqlClient.post("", { query, variables });
    if (response.data.errors) {
      const error = response.data.errors[0];
      // Extract validation error message if available
      if (error.extensions?.validation) {
        const validationErrors = error.extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        throw new Error(errorMessage);
      }
      throw new Error(error.message || "GraphQL error");
    }
    return response.data.data.approveJoinRequest;
  } catch (e) {
    console.error("approveJoinRequest failed:", e);
    // If error already has a message, re-throw it
    if (e.message) {
      throw e;
    }
    // Otherwise, extract from response if available
    if (e?.response?.data?.errors?.[0]) {
      const error = e.response.data.errors[0];
      if (error.extensions?.validation) {
        const validationErrors = error.extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      throw new Error(error.message || "Failed to approve join request");
    }
    throw e;
  }
};