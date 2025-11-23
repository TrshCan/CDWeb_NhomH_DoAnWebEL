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
        likes {
          id
          user_id
          user {
            id
            name
          }
        }
        children {
          id
        }
        media {
          id
          url
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
        created_at
        user {
          id
          name
        }
        parent {
          id
          content
          user {
            id
            name
          }
        }
        children {
          id
          content
          created_at
          parent_id
          user {
            id
            name
          }
          parent {
            id
            user {
              id
              name
            }
          }
          likes {
            id
            user_id
            user {
              id
              name
            }
          }
          media {
            id
            url
          }
          children {
            id
            content
            created_at
            parent_id
            user {
              id
              name
            }
            parent {
              id
              user {
                id
                name
              }
            }
            likes {
              id
              user_id
              user {
                id
                name
              }
            }
            media {
              id
              url
            }
          }
        }
        likes {
          id
          user_id
          user {
            id
            name
          }
        }
        media {
          id
          url
        }
      }
    }
  `;
  const variables = { id };

  const response = await graphqlClient.post("", { query, variables });
  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }
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
        likes {
          id
          user_id
          user {
            id
            name
          }
        }
        children {
          id
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
    // Không set Content-Type header, để axios tự động set với boundary
    const response = await graphqlClient.post('', formData);
    
    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      const error = response.data.errors[0];
      const errorMessage = error.message || "Failed to create post";
      
      // Nếu có validation errors, lấy thông tin chi tiết
      if (error.extensions?.validation) {
        const validationErrors = error.extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      
      throw new Error(errorMessage);
    }
    
    return response.data.data.createPost;
  } catch (err) {
    console.error('createPost (with files) failed:', err);
    console.error('Error response:', err?.response?.data);
    
    // Nếu có response từ server, lấy error message chi tiết hơn
    if (err?.response?.data?.errors) {
      const error = err.response.data.errors[0];
      throw new Error(error.message || "Internal server error");
    }
    
    throw err;
  }
};

export const updatePost = async (id, content) => {
  const query = `
    mutation ($input: UpdatePostInput!) {
      updatePost(input: $input) {
        id
        content
        created_at
        user { id name }
      }
    }
  `;
  const variables = { input: { id: id.toString(), content } };
  const response = await graphqlClient.post("", { query, variables });
  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }
  return response.data.data.updatePost;
};

export const deletePost = async (id) => {
  const query = `
    mutation ($id: ID!) {
      deletePost(id: $id)
    }
  `;
  const variables = { id: id.toString() };
  const response = await graphqlClient.post("", { query, variables });
  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }
  return response.data.data.deletePost;
};

export const toggleLike = async (postId, userId) => {
  const query = `
    mutation ($post_id: ID!, $user_id: ID!) {
      toggleLike(post_id: $post_id, user_id: $user_id)
    }
  `;
  const variables = { 
    post_id: postId.toString(), 
    user_id: userId.toString() 
  };
  const response = await graphqlClient.post("", { query, variables });
  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }
  return response.data.data.toggleLike;
};

export const createComment = async (postId, userId, content, files = []) => {
  const input = {
    user_id: userId.toString(),
    parent_id: postId.toString(),
    type: "comment",
    content: content,
  };
  return await createPost(input, files);
};

export const getPostsOfFollowing = async (followingIds) => {
  const query = `
    query ($ids: [Int!]!) {
      postsOfFollowing(followingIds: $ids) {
        id
        content
        created_at
        user {
          id
          name
        }
        likes {
          id
          user_id
          user {
            id
            name
          }
        }
        media {
          id
          url
        }
        children {
          id
        }
      }
    }
  `;

  const variables = { ids: followingIds };

  const response = await graphqlClient.post("", { query, variables });

  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }

  return response.data.data.postsOfFollowing;
};
