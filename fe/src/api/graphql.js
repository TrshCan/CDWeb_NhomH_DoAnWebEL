// fe/src/api/graphql.js
import axios from "axios";

const GRAPHQL_URL = "http://127.0.0.1:8000/graphql"; // thay bằng URL BE của bạn

export const graphqlRequest = async (query, variables = {}) => {
  try {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(GRAPHQL_URL, { query, variables }, {
      headers,
    });
    
    // Kiểm tra GraphQL errors
    if (response.data.errors) {
      const error = response.data.errors[0];
      console.error("GraphQL error:", error);
      
      // Extract error message from extensions if available
      let errorMessage = error.message || 'Có lỗi xảy ra';
      if (error.extensions?.validation) {
        const validationErrors = error.extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      
      throw new Error(errorMessage);
    }
    
    return response.data;
  } catch (error) {
    console.error("GraphQL request error:", error);
    
    // Xử lý lỗi từ response
    if (error.response?.data?.errors) {
      const graphqlError = error.response.data.errors[0];
      console.error("GraphQL error details:", graphqlError);
      
      // Extract error message from extensions if available
      let errorMessage = graphqlError.message || 'Có lỗi xảy ra';
      if (graphqlError.extensions?.validation) {
        const validationErrors = graphqlError.extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      
      throw new Error(errorMessage);
    }
    
    // Xử lý lỗi network hoặc lỗi khác
    if (error.message) {
      throw error;
    }
    
    throw new Error('Có lỗi xảy ra, vui lòng thử lại');
  }
};