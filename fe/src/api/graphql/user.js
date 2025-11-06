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
      variables: { id },
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

export const updateProfile = async (name, email, address = null, password = null, password_confirmation = null, avatarFile = null) => {
  // Lấy userId từ localStorage
  const userId = parseInt(localStorage.getItem("userId"));
  
  if (!userId) {
    throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
  }

  const mutation = `
    mutation ($user_id: Int!, $name: String!, $email: String!, $address: String, $password: String, $password_confirmation: String, $avatar: Upload) {
      updateProfile(
        user_id: $user_id
        name: $name
        email: $email
        address: $address
        password: $password
        password_confirmation: $password_confirmation
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
      const response = await graphqlClient.post('', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.errors) {
        console.error("GraphQL errors:", response.data.errors);
        // Trích xuất thông báo lỗi chi tiết hơn
        const error = response.data.errors[0];
        const errorMessage = error.message || "Có lỗi xảy ra";
        // Nếu có extensions với validation errors, lấy thông tin từ đó
        if (error.extensions?.validation) {
          const validationErrors = error.extensions.validation;
          const firstError = Object.values(validationErrors)[0];
          throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
        }
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
    const response = await graphqlClient.post('', {
      query: mutation,
      variables: {
        user_id: userId,
        name,
        email,
        address,
        password,
        password_confirmation,
      },
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.updateProfile;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
};