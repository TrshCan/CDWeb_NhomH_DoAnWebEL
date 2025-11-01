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

export const createPost = async (input, files = []) => {
  console.log('createPost input:', input);
  console.log('createPost files:', files.length, files.map(f => f.name));

  const query = `
    mutation ($input: CreatePostInput!, $media: [Upload]) {
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

  // ✅ If no files, send normal JSON (simpler)
  if (files.length === 0) {
    try {
      const response = await graphqlClient.post('', {
        query,
        variables: { input, media: [] },
      });
      if (response.data.errors) throw new Error(response.data.errors[0].message);
      return response.data.data.createPost;
    } catch (err) {
      console.error('createPost (no files) failed:', err);
      throw err;
    }
  }

  // ✅ With files: use multipart upload
  const formData = new FormData();
  formData.append(
    'operations',
    JSON.stringify({
      query,
      variables: { input, media: files.map(() => null) },
    })
  );
  formData.append(
    'map',
    JSON.stringify(
      files.reduce((acc, _, i) => ({ ...acc, [i]: [`variables.media.${i}`] }), {})
    )
  );
  files.forEach((file, i) => formData.append(i.toString(), file));

  try {
    const response = await graphqlClient.post('', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.createPost;
  } catch (err) {
    console.error('createPost (with files) failed:', err);
    throw err;
  }
};
