
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
      console.error("GraphQL error extensions:", error.extensions);
      console.error("GraphQL error message:", error.message);
      
      // Extract error message - ưu tiên exception message từ Laravel
      let errorMessage = 'Có lỗi xảy ra';
      
      // Priority 0: Check error.message trước (GraphQL Error class thường đưa message vào đây)
      // Nhưng chỉ dùng nếu không phải generic error
      if (error.message && error.message !== 'Internal server error' && error.message !== 'Có lỗi xảy ra') {
        errorMessage = error.message;
      }
      // Priority 1: Check exception message from Laravel (most specific)
      // Laravel Lighthouse có thể lưu exception message ở nhiều nơi
      else if (error.extensions?.exception?.message) {
        errorMessage = error.extensions.exception.message;
      }
      // Check trong exception object trực tiếp
      else if (error.extensions?.exception && typeof error.extensions.exception === 'string') {
        errorMessage = error.extensions.exception;
      }
      // Check trong exception.category hoặc exception.class
      else if (error.extensions?.exception?.getMessage && typeof error.extensions.exception.getMessage === 'function') {
        errorMessage = error.extensions.exception.getMessage();
      }
      // Priority 2: Check validation errors
      else if (error.extensions?.validation) {
        const validationErrors = error.extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      // Priority 3: Check other extensions message
      else if (error.extensions?.message) {
        errorMessage = error.extensions.message;
      }
      // Priority 4: Check debugMessage (Lighthouse debug mode)
      else if (error.extensions?.debugMessage) {
        errorMessage = error.extensions.debugMessage;
      }
      // Priority 5: error.message đã được check ở Priority 0, không cần check lại
      
      // Nếu vẫn là generic error, thử tìm trong toàn bộ error object
      if (errorMessage === 'Có lỗi xảy ra' || errorMessage === 'Internal server error') {
        // Kiểm tra trong extensions.category hoặc extensions.class
        if (error.extensions?.category) {
          errorMessage = error.extensions.category;
        }
        // Kiểm tra trong extensions.originalMessage
        else if (error.extensions?.originalMessage) {
          errorMessage = error.extensions.originalMessage;
        }
        // Kiểm tra trong extensions.laravel
        else if (error.extensions?.laravel?.message) {
          errorMessage = error.extensions.laravel.message;
        }
      }
      
      // Log toàn bộ error object để debug
      if (errorMessage === 'Có lỗi xảy ra' || errorMessage === 'Internal server error') {
        console.error("Full error object for debugging:", JSON.stringify(error, null, 2));
        console.error("Error extensions keys:", error.extensions ? Object.keys(error.extensions) : 'no extensions');
      }
      
      console.log("Extracted error message:", errorMessage);
      throw new Error(errorMessage);
    }
    
    return response.data;
  } catch (error) {
    console.error("GraphQL request error:", error);
    
    // Xử lý lỗi từ response
    if (error.response?.data?.errors) {
      const graphqlError = error.response.data.errors[0];
      console.error("GraphQL error details:", graphqlError);
      console.error("GraphQL error extensions:", graphqlError.extensions);
      console.error("GraphQL error message:", graphqlError.message);
      
      // Extract error message - ưu tiên exception message từ Laravel
      let errorMessage = 'Có lỗi xảy ra';
      
      // Priority 0: Check error.message trước (GraphQL Error class thường đưa message vào đây)
      // Nhưng chỉ dùng nếu không phải generic error
      if (graphqlError.message && graphqlError.message !== 'Internal server error' && graphqlError.message !== 'Có lỗi xảy ra') {
        errorMessage = graphqlError.message;
      }
      // Priority 1: Check exception message from Laravel (most specific)
      // Laravel Lighthouse có thể lưu exception message ở nhiều nơi
      else if (graphqlError.extensions?.exception?.message) {
        errorMessage = graphqlError.extensions.exception.message;
      }
      // Check trong exception object trực tiếp
      else if (graphqlError.extensions?.exception && typeof graphqlError.extensions.exception === 'string') {
        errorMessage = graphqlError.extensions.exception;
      }
      // Check trong exception.category hoặc exception.class
      else if (graphqlError.extensions?.exception?.getMessage && typeof graphqlError.extensions.exception.getMessage === 'function') {
        errorMessage = graphqlError.extensions.exception.getMessage();
      }
      // Priority 2: Check validation errors
      else if (graphqlError.extensions?.validation) {
        const validationErrors = graphqlError.extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      // Priority 3: Check other extensions message
      else if (graphqlError.extensions?.message) {
        errorMessage = graphqlError.extensions.message;
      }
      // Priority 4: Check debugMessage (Lighthouse debug mode)
      else if (graphqlError.extensions?.debugMessage) {
        errorMessage = graphqlError.extensions.debugMessage;
      }
      // Priority 5: error.message đã được check ở Priority 0, không cần check lại
      
      // Nếu vẫn là generic error, thử tìm trong toàn bộ error object
      if (errorMessage === 'Có lỗi xảy ra' || errorMessage === 'Internal server error') {
        // Kiểm tra trong extensions.category hoặc extensions.class
        if (graphqlError.extensions?.category) {
          errorMessage = graphqlError.extensions.category;
        }
        // Kiểm tra trong extensions.originalMessage
        else if (graphqlError.extensions?.originalMessage) {
          errorMessage = graphqlError.extensions.originalMessage;
        }
        // Kiểm tra trong extensions.laravel
        else if (graphqlError.extensions?.laravel?.message) {
          errorMessage = graphqlError.extensions.laravel.message;
        }
        // Kiểm tra trong toàn bộ extensions object (có thể message nằm ở đâu đó)
        else if (graphqlError.extensions) {
          // Tìm bất kỳ field nào có chứa "message" trong extensions
          const extensionsStr = JSON.stringify(graphqlError.extensions);
          const messageMatch = extensionsStr.match(/"message":\s*"([^"]+)"/);
          if (messageMatch && messageMatch[1] && messageMatch[1] !== 'Internal server error') {
            errorMessage = messageMatch[1];
          }
        }
      }
      
      // Log toàn bộ error object để debug
      if (errorMessage === 'Có lỗi xảy ra' || errorMessage === 'Internal server error') {
        console.error("Full graphqlError object for debugging:", JSON.stringify(graphqlError, null, 2));
        console.error("GraphqlError extensions keys:", graphqlError.extensions ? Object.keys(graphqlError.extensions) : 'no extensions');
      }
      
      console.log("Extracted error message from catch:", errorMessage);
      throw new Error(errorMessage);
    }
    
    // Xử lý lỗi network hoặc lỗi khác
    if (error.message) {
      throw error;
    }
    
    throw new Error('Có lỗi xảy ra, vui lòng thử lại');
  }
};