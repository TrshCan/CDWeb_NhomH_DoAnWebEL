// src/api/graphql/permission.js
import { graphqlRequest } from '../graphql.js';

// Query: Lấy tất cả permissions theo nhóm
export const GET_PERMISSIONS_QUERY = `
  query {
    permissions {
      name
      permissions {
        id
        name
        description
      }
    }
  }
`;

// Query: Lấy quyền của một role
export const GET_ROLE_PERMISSIONS_QUERY = `
  query GetRolePermissions($role: String!) {
    rolePermissions(role: $role) {
      role
      permission_ids
    }
  }
`;

// Query: Lấy quyền của một user
export const GET_USER_PERMISSIONS_QUERY = `
  query GetUserPermissions($user_id: Int!) {
    userPermissions(user_id: $user_id) {
      user_id
      permission_ids
    }
  }
`;

// Query: Lấy danh sách users để chọn
export const GET_USERS_FOR_PERMISSION_QUERY = `
  query {
    usersForPermission {
      id
      name
      email
      role
    }
  }
`;

// Mutation: Cập nhật quyền cho role
export const UPDATE_ROLE_PERMISSIONS_MUTATION = `
  mutation UpdateRolePermissions($role: String!, $permission_ids: [Int!]!) {
    updateRolePermissions(role: $role, permission_ids: $permission_ids)
  }
`;

// Mutation: Cập nhật quyền cho user
export const UPDATE_USER_PERMISSIONS_MUTATION = `
  mutation UpdateUserPermissions($user_id: Int!, $permission_ids: [Int!]!) {
    updateUserPermissions(user_id: $user_id, permission_ids: $permission_ids)
  }
`;

// API functions
export const getPermissions = async () => {
  try {
    const data = await graphqlRequest(GET_PERMISSIONS_QUERY);
    return data?.data?.permissions || [];
  } catch (error) {
    console.error('Lỗi khi lấy permissions:', error);
    throw error;
  }
};

export const getRolePermissions = async (role) => {
  try {
    const data = await graphqlRequest(GET_ROLE_PERMISSIONS_QUERY, { role });
    return data?.data?.rolePermissions || { role, permission_ids: [] };
  } catch (error) {
    console.error('Lỗi khi lấy role permissions:', error);
    throw error;
  }
};

export const getUserPermissions = async (userId) => {
  try {
    const data = await graphqlRequest(GET_USER_PERMISSIONS_QUERY, { user_id: userId });
    return data?.data?.userPermissions || { user_id: userId, permission_ids: [] };
  } catch (error) {
    console.error('Lỗi khi lấy user permissions:', error);
    throw error;
  }
};

export const getUsersForPermission = async () => {
  try {
    const data = await graphqlRequest(GET_USERS_FOR_PERMISSION_QUERY);
    return data?.data?.usersForPermission || [];
  } catch (error) {
    console.error('Lỗi khi lấy users:', error);
    throw error;
  }
};

export const updateRolePermissions = async (role, permissionIds) => {
  try {
    const data = await graphqlRequest(UPDATE_ROLE_PERMISSIONS_MUTATION, {
      role,
      permission_ids: permissionIds,
    });
    return data?.data?.updateRolePermissions || false;
  } catch (error) {
    console.error('Lỗi khi cập nhật role permissions:', error);
    throw error;
  }
};

export const updateUserPermissions = async (userId, permissionIds) => {
  try {
    const data = await graphqlRequest(UPDATE_USER_PERMISSIONS_MUTATION, {
      user_id: userId,
      permission_ids: permissionIds,
    });
    return data?.data?.updateUserPermissions || false;
  } catch (error) {
    console.error('Lỗi khi cập nhật user permissions:', error);
    throw error;
  }
};

