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
        deleted_at
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

export const isUserMemberOfGroup = async (userId, groupId) => {
  // Validate groupId is numeric
  if (!groupId || isNaN(parseInt(groupId))) {
    return false;
  }

  const query = `
    query ($userId: ID!, $groupId: ID!) {
      isUserMemberOfGroup(userId: $userId, groupId: $groupId)
    }
  `;

  const variables = {
    userId: userId.toString(),
    groupId: groupId.toString(),
  };

  try {
    const response = await graphqlClient.post("", { query, variables });
    
    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      return false;
    }

    return response.data.data.isUserMemberOfGroup || false;
  } catch (error) {
    console.error("isUserMemberOfGroup failed:", error);
    return false;
  }
};

export const isUserGroupAdminOrModerator = async (userId, groupId) => {
  if (!groupId || isNaN(parseInt(groupId))) return false;

  const query = `
    query ($userId: ID!, $groupId: ID!) {
      isUserGroupAdminOrModerator(userId: $userId, groupId: $groupId)
    }
  `;

  const variables = { userId: userId.toString(), groupId: groupId.toString() };

  try {
    const response = await graphqlClient.post("", { query, variables });
    if (response.data.errors) return false;
    return response.data.data.isUserGroupAdminOrModerator || false;
  } catch (e) {
    console.error("isUserGroupAdminOrModerator failed:", e);
    return false;
  }
};

export const updateGroup = async (id, name, description) => {
  const query = `
    mutation ($id: ID!, $name: String, $description: String) {
      updateGroup(id: $id, name: $name, description: $description) {
        id
        name
        description
        code
        deleted_at
      }
    }
  `;
  const variables = { id: id.toString(), name, description };
  const response = await graphqlClient.post("", { query, variables });
  if (response.data.errors) throw new Error(response.data.errors[0]?.message || "GraphQL error");
  return response.data.data.updateGroup;
};

export const deleteGroup = async (id) => {
  const query = `
    mutation ($id: ID!) {
      deleteGroup(id: $id)
    }
  `;
  const variables = { id: id.toString() };
  
  try {
    const response = await graphqlClient.post("", { query, variables });
    
    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      throw new Error(response.data.errors[0]?.message || "Failed to delete group");
    }

    return response.data.data.deleteGroup;
  } catch (error) {
    console.error("deleteGroup failed:", error);
    throw error;
  }
};