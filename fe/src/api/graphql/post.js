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

export const getPostsByType = async (type) => {
  const query = `
    query ($type: String!) {
      postsByType(type: $type) {
        id
        type
        content
        created_at
        user { 
          id
          name 
        }
        media {
          id
          url
        }
      }
    }
  `;
  const response = await graphqlClient.post("", { query, variables: { type } });
  return response.data.data.postsByType;
};

export const createPost = async (input) => {
  const query = `
    mutation ($input: CreatePostInput!) {
      createPost(input: $input) {
        id
        type
        content
        media_url
        created_at
        user {
          id
          name
        }
      }
    }
  `;
  const response = await graphqlClient.post("", { query, variables: { input } });
  return response.data.data.createPost;
};

