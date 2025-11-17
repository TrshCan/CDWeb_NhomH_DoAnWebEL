// fe/src/api/graphql.js
import axios from "axios";

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "/graphql";

export const graphqlRequest = async (query, variables = {}) => {
  try {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      GRAPHQL_URL,
      { query, variables },
      {
        headers,
      }
    );

    // Kiểm tra GraphQL errors
    if (response.data.errors) {
      const error = response.data.errors[0];
      throw new Error(error.message || "Có lỗi xảy ra");
    }

    return response.data;
  } catch (error) {
    console.error(error);

    // Xử lý lỗi từ response
    if (error.response?.data?.errors) {
      const graphqlError = error.response.data.errors[0];
      throw new Error(graphqlError.message || "Có lỗi xảy ra");
    }

    // Xử lý lỗi network hoặc lỗi khác
    if (error.message) {
      throw error;
    }

    throw new Error("Có lỗi xảy ra, vui lòng thử lại");
  }
};
