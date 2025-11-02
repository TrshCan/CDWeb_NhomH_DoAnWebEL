// src/api/graphql/group.js

import graphqlClient from "./client";

export const getAllPosts = async () => {
  const query = `
    query {
      posts {
        id
        content
        created_at
        user {
          id
          name
        }
      }
    }
  `;

  const response = await graphqlClient.post("", { query });
  return response.data.data.posts;
};

export const getPostById = async (id) => {
  const query = `
    query ($id: ID!) {
      post(id: $id) {
        id
        content
      }
    }
  `;
  const variables = { id };

  const response = await graphqlClient.post("", { query, variables });
  return response.data.data.post;
};

export const getGroupsByUser = async (userId) => {
  const query = `
    query ($userId: ID!) {
      groupsByUser(userId: $userId) {
        id
        name
        description
        code
        created_at
        created_by
        creator {
          id
          name
        }
        members {
          id
          name
        }
      }
    }
  `;

  const variables = { userId: userId.toString() };

  try {
    const response = await graphqlClient.post("", { query, variables });
    
    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      throw new Error(response.data.errors[0]?.message || "GraphQL error");
    }

    return response.data.data.groupsByUser;
  } catch (error) {
    console.error("getGroupsByUser failed:", error);
    throw error;
  }
};

export const createGroup = async (name, description, userId) => {
  const query = `
    mutation ($name: String!, $description: String, $userId: ID) {
      createGroup(name: $name, description: $description, userId: $userId) {
        id
        name
        description
        code
        created_at
        created_by
        creator {
          id
          name
        }
      }
    }
  `;

  const variables = {
    name,
    description: description || null,
    userId: userId ? userId.toString() : null,
  };

  try {
    const response = await graphqlClient.post("", { query, variables });
    
    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      throw new Error(response.data.errors[0]?.message || "GraphQL error");
    }

    return response.data.data.createGroup;
  } catch (error) {
    console.error("createGroup failed:", error);
    throw error;
  }
};