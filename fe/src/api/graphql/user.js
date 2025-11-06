// src/api/graphql/user.js
import graphqlClient from "./client";

export const getUserProfile = async (id) => {
  const query = `
    query ($id: Int!) {
      publicProfile(id: $id) {
        id
        name
        email
        role
      }
    }
  `;

  try {
    const response = await graphqlClient.post("", {
      query,
      variables: { id },
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.publicProfile;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    throw error;
  }
};
