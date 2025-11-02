// src/api/graphql/post.js

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

export const getPostsByGroup = async (groupId) => {
  const query = `
    query ($group_id: ID!) {
      postsByGroup(group_id: $group_id) {
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
  
  try {
    const response = await graphqlClient.post("", { 
      query, 
      variables: { group_id: groupId.toString() } 
    });
    
    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      throw new Error(response.data.errors[0]?.message || "GraphQL error");
    }
    
    return response.data.data.postsByGroup;
  } catch (error) {
    console.error("getPostsByGroup failed:", error);
    throw error;
  }
};

export const createPost = async (input, files = []) => {
  console.log('createPost input:', input);
  console.log('createPost files:', files.length, files.map(f => f.name));

  const query = `
    mutation ($input: CreatePostInput!, $media: [Upload!]) {
      createPost(input: $input, media: $media) {
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

  const formData = new FormData();
  formData.append(
    'operations',
    JSON.stringify({
      query,
      variables: { input, media: files.length ? files.map(() => null) : null },
    })
  );

  if (files.length) {
    formData.append(
      'map',
      JSON.stringify(
        files.reduce((acc, _, i) => ({ ...acc, [i]: [`variables.media.${i}`] }), {})
      )
    );
    files.forEach((file, i) => formData.append(i.toString(), file));
  }

  try {
    const response = await graphqlClient.post('', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('createPost response:', JSON.stringify(response.data, null, 2));
    console.log('createPost response.data:', response.data);

    if (response.data.errors) {
      console.error('createPost GraphQL errors:', response.data.errors);
      throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
    }

    if (!response.data.data || !response.data.data.createPost) {
      console.error('createPost error: response.data.data is undefined', response.data);
      throw new Error('GraphQL response does not contain createPost data');
    }

    console.log('createPost success:', response.data.data.createPost);
    return response.data.data.createPost;
  } catch (error) {
    console.error('createPost failed:', error.message, error);
    throw error;
  }
};
