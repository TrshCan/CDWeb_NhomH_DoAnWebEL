// src/api/graphql/user.js
import graphqlClient from "./client";

export const getUserProfile = async (id) => {
    const query = `
    query ($id: Int!) {
      publicProfile(id: $id) {
        id
        name
        email
      }
    }
  `;

    try {
        const response = await graphqlClient.post("", {
            query,
            variables: {id},
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

export const getUserFollowingIds = async (id) => {
    const query = `
    query ($id: Int!) {
      publicProfile(id: $id) {
        following
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

        const following = response.data.data?.publicProfile?.following || [];
        return following.map((v) => parseInt(v)).filter((n) => !Number.isNaN(n));
    } catch (error) {
        console.error("Failed to get following ids:", error);
        throw error;
    }
};

export const updateProfile = async (
    name,
    email,
    address = null,
    password = null,
    password_confirmation = null,
    avatarFile = null,
    current_password = null
) => {
    // Lấy userId từ localStorage
    const userId = parseInt(localStorage.getItem("userId"));

    if (!userId) {
        throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
    }

    const mutation = `
    mutation ($user_id: Int!, $name: String!, $email: String!, $address: String, $password: String, $current_password: String, $password_confirmation: String, $avatar: Upload) {
      updateProfile(
        user_id: $user_id
        name: $name
        email: $email
        address: $address
        password: $password
        password_confirmation: $password_confirmation
        current_password: $current_password
        avatar: $avatar
      ) {
        id
        name
        email
        address
        avatar
      }
    }
  `;

    // Nếu có avatar file, sử dụng multipart form data
    if (avatarFile) {
        const formData = new FormData();
        formData.append(
            'operations',
            JSON.stringify({
                query: mutation,
                variables: {
                    user_id: userId,
                    name,
                    email,
                    address,
                    password,
                    password_confirmation,
                    current_password: current_password || null,
                    avatar: null, // File sẽ được map sau
                },
            })
        );
        formData.append(
            'map',
            JSON.stringify({
                '0': ['variables.avatar'],
            })
        );
        formData.append('0', avatarFile);

        try {
            const response = await graphqlClient.post("", formData, {
                headers: {"Content-Type": "multipart/form-data"},
            });

            if (response.data.errors) {
                console.error("GraphQL errors:", response.data.errors);
                // Trích xuất thông báo lỗi chi tiết hơn
                const error = response.data.errors[0];
                // Nếu có extensions với validation errors, lấy thông tin từ đó
                if (error.extensions?.validation) {
                    const validationErrors = error.extensions.validation;
                    const firstError = Object.values(validationErrors)[0];
                    throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
                }
                const errorMessage = error.message || error.extensions?.message || "Có lỗi xảy ra";
                throw new Error(errorMessage);
            }

            return response.data.data.updateProfile;
        } catch (error) {
            console.error("Failed to update profile:", error);
            throw error;
        }
    }

    // Nếu không có avatar, gửi JSON bình thường
    try {
        const response = await graphqlClient.post("", {
            query: mutation,
            variables: {
                user_id: userId,
                name,
                email,
                address,
                password,
                password_confirmation,
                current_password: current_password || null,
            },
        });

        if (response.data.errors) {
            console.error("GraphQL errors:", response.data.errors);
            const error = response.data.errors[0];
            // Lấy message từ nhiều nguồn có thể
            let errorMessage = error.message;
            if (!errorMessage && error.extensions) {
                errorMessage = error.extensions.message || error.extensions.exception?.message;
            }
            errorMessage = errorMessage || "Có lỗi xảy ra";
            console.error("Throwing error with message:", errorMessage);
            throw new Error(errorMessage);
        }

        return response.data.data.updateProfile;
    } catch (error) {
        console.error("Failed to update profile:", error);
        // Nếu error đã có message, throw lại
        if (error.message) {
            throw error;
        }
        // Nếu error từ axios response, lấy message từ response.data.errors
        if (error.response?.data?.errors) {
            const errorMsg = error.response.data.errors[0]?.message || "Cập nhật thất bại. Vui lòng thử lại.";
            throw new Error(errorMsg);
        }
        // Nếu không có message, throw error mới
        throw new Error(error.message || "Cập nhật thất bại. Vui lòng thử lại.");
    }
};


// --- GRAPHQL QUERIES ---
 export const PROFILE_QUERY = `
  query getProfileQueries($id: Int!) {
    publicProfile(id: $id) {
      id
      name
      email
      phone
      address
      avatar
      role
      created_at
      stats {
        posts
        followers
        following
      }
      badges {
        name
        description
        created_at
        assigned_at
      }
    }
  }
`;

 export const USER_POSTS_QUERY = `
  query getUserPosts($user_id: ID!) {
    postsByUser(user_id: $user_id) {
      id
      content
      type
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
      media {
        id
        url
      }
      likes {
        id
        user_id
      }
      children {
        id
      }
    }
  }
`;

export const USER_REPLIES_QUERY = `
  query getUserReplies($user_id: ID!) {
    repliesByUser(user_id: $user_id) {
      id
      content
      created_at
      parent {
        id
        user { id name }
      }
      user { id name }
      media { id url }
      likes { id user_id }
    }
  }
`;
 export const USER_LIKES_QUERY = `
  query getUserLikes($user_id: ID!) {
    likedPostsByUser(user_id: $user_id) {
      id
      content
      created_at
      user { id name }
      media { id url }
      likes { id user_id }
    }
  }
`;
