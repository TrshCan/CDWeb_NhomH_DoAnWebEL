// fe/src/api/graphql.js
import axios from "axios";

const GRAPHQL_URL = "http://127.0.0.1:8000/graphql";

// --------------------------------------------------------

export const graphqlRequest = async (query, variables = {}) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      GRAPHQL_URL,
      { query, variables },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      }
    );

    // GraphQL báo lỗi
    if (response.data?.errors?.length) {
      throw new Error(extractErrorMessage(response.data.errors[0]));
    }

    return response.data;
  } catch (error) {
    console.error("GraphQL request error:", error);

    // Lỗi GraphQL
    if (error.response?.data?.errors?.length) {
      throw new Error(extractErrorMessage(error.response.data.errors[0]));
    }

    // Lỗi mạng
    if (error.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }

    // Lỗi khác
    throw new Error(error.message || "Có lỗi xảy ra");
  }
};

// --------------------------------------------------------

function extractErrorMessage(error) {
  let msg = "Có lỗi xảy ra";

  // Priority 0: error.message
  if (
    error.message &&
    error.message !== "Internal server error" &&
    error.message !== "Có lỗi xảy ra"
  ) {
    return error.message;
  }

  // Priority 1: Laravel exception
  if (error.extensions?.exception?.message) return error.extensions.exception.message;

  // Exception string
  if (error.extensions?.exception && typeof error.extensions.exception === "string") {
    return error.extensions.exception;
  }

  // Exception getMessage()
  if (error.extensions?.exception?.getMessage) {
    return error.extensions.exception.getMessage();
  }

  // Priority 2: Validation errors
  if (error.extensions?.validation) {
    const first = Object.values(error.extensions.validation)[0];
    return Array.isArray(first) ? first[0] : first;
  }

  // Priority 3: message khác trong extensions
  if (error.extensions?.message) return error.extensions.message;

  // Priority 4: debugMessage
  if (error.extensions?.debugMessage) return error.extensions.debugMessage;

  // Tìm message trong toàn bộ extensions (fallback)
  if (error.extensions) {
    const match = JSON.stringify(error.extensions).match(/"message":"([^"]+)"/);
    if (match && match[1] !== "Internal server error") return match[1];
  }

  return msg;
}
