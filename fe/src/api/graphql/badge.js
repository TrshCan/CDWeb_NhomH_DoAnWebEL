// src/api/graphql/badge.js
import graphqlClient from "./client";

// Lấy danh sách badge với phân trang
export const getAdminBadges = async (page = 1, perPage = 10, sortBy = "id", sortOrder = "asc") => {
    const query = `
        query ($page: Int, $perPage: Int, $sortBy: String, $sortOrder: String) {
            adminBadges(page: $page, perPage: $perPage, sortBy: $sortBy, sortOrder: $sortOrder) {
                data {
                    id
                    name
                    description
                    created_at
                    updated_at
                    user_count
                }
                pagination {
                    currentPage
                    perPage
                    total
                    totalPages
                    hasNextPage
                    hasPrevPage
                }
            }
        }
    `;

    try {
        const response = await graphqlClient.post("", {
            query,
            variables: { page, perPage, sortBy, sortOrder },
        });

        if (response.data.errors) {
            console.error("GraphQL errors:", response.data.errors);
            throw new Error(response.data.errors[0].message);
        }

        return response.data.data.adminBadges;
    } catch (error) {
        console.error("Failed to get admin badges:", error);
        throw error;
    }
};

// Lấy thông tin một badge
export const getAdminBadge = async (id) => {
    const query = `
        query ($id: ID!) {
            adminBadge(id: $id) {
                id
                name
                description
                created_at
                updated_at
                user_count
                users {
                    user_id
                    user_name
                    user_email
                    assigned_at
                    assigned_by
                    assigned_by_name
                }
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

        return response.data.data.adminBadge;
    } catch (error) {
        console.error("Failed to get admin badge:", error);
        throw error;
    }
};

// Tạo badge mới
export const createAdminBadge = async (name, description = null) => {
    const mutation = `
        mutation ($name: String!, $description: String) {
            adminCreateBadge(name: $name, description: $description) {
                id
                name
                description
                created_at
            }
        }
    `;

    try {
        const response = await graphqlClient.post("", {
            query: mutation,
            variables: { name, description },
        });

        if (response.data.errors) {
            console.error("GraphQL errors:", response.data.errors);
            throw new Error(response.data.errors[0].message);
        }

        return response.data.data.adminCreateBadge;
    } catch (error) {
        console.error("Failed to create admin badge:", error);
        throw error;
    }
};

// Cập nhật badge
export const updateAdminBadge = async (id, name = null, description = null) => {
    const mutation = `
        mutation ($id: ID!, $name: String, $description: String) {
            adminUpdateBadge(id: $id, name: $name, description: $description) {
                id
                name
                description
                updated_at
            }
        }
    `;

    try {
        const response = await graphqlClient.post("", {
            query: mutation,
            variables: { id, name, description },
        });

        if (response.data.errors) {
            console.error("GraphQL errors:", response.data.errors);
            throw new Error(response.data.errors[0].message);
        }

        return response.data.data.adminUpdateBadge;
    } catch (error) {
        console.error("Failed to update admin badge:", error);
        throw error;
    }
};

// Xóa badge
export const deleteAdminBadge = async (id) => {
    const mutation = `
        mutation ($id: ID!) {
            adminDeleteBadge(id: $id)
        }
    `;

    try {
        const response = await graphqlClient.post("", {
            query: mutation,
            variables: { id },
        });

        if (response.data.errors) {
            console.error("GraphQL errors:", response.data.errors);
            throw new Error(response.data.errors[0].message);
        }

        return response.data.data.adminDeleteBadge;
    } catch (error) {
        console.error("Failed to delete admin badge:", error);
        throw error;
    }
};

// Cấp badge cho user
export const assignAdminBadge = async (badgeId, userId) => {
    // Lấy user ID từ localStorage
    const assignedBy = localStorage.getItem("userId");
    
    const mutation = `
        mutation ($badge_id: ID!, $user_id: ID!, $assigned_by: ID) {
            adminAssignBadge(badge_id: $badge_id, user_id: $user_id, assigned_by: $assigned_by)
        }
    `;

    try {
        const response = await graphqlClient.post("", {
            query: mutation,
            variables: { 
                badge_id: badgeId, 
                user_id: userId,
                assigned_by: assignedBy || null
            },
        });

        if (response.data.errors) {
            console.error("GraphQL errors:", response.data.errors);
            throw new Error(response.data.errors[0].message);
        }

        return response.data.data.adminAssignBadge;
    } catch (error) {
        console.error("Failed to assign admin badge:", error);
        throw error;
    }
};

// Thu hồi badge từ user
export const revokeAdminBadge = async (badgeId, userId) => {
    const mutation = `
        mutation ($badge_id: ID!, $user_id: ID!) {
            adminRevokeBadge(badge_id: $badge_id, user_id: $user_id)
        }
    `;

    try {
        const response = await graphqlClient.post("", {
            query: mutation,
            variables: { badge_id: badgeId, user_id: userId },
        });

        if (response.data.errors) {
            console.error("GraphQL errors:", response.data.errors);
            throw new Error(response.data.errors[0].message);
        }

        return response.data.data.adminRevokeBadge;
    } catch (error) {
        console.error("Failed to revoke admin badge:", error);
        throw error;
    }
};

