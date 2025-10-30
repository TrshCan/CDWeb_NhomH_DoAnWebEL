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