// fe/src/api/graphql.js
import axios from "axios";

const GRAPHQL_URL = "http://127.0.0.1:8000/graphql";

// Hàm extract error của bạn, gom lại cho gọn nhưng giữ nguyên toàn bộ ưu tiên
const extractErrorMessage = (errorObj) => {
  if (!errorObj) return "Có lỗi xảy ra";

  let msg = "Có lỗi xảy ra";

  if (errorObj.message && errorObj.message !== "Internal server error" && errorObj.message !== "Có lỗi xảy ra") {
    msg = errorObj.message;
  } else if (errorObj.extensions?.exception?.message) {
    msg = errorObj.extensions.exception.message;
  } else if (typeof errorObj.extensions?.exception === "string") {
    msg = errorObj.extensions.exception;
  } else if (errorObj.extensions?.exception?.getMessage) {
    msg = errorObj.extensions.exception.getMessage();
  } else if (errorObj.extensions?.validation) {
    const first = Object.values(errorObj.extensions.validation)[0];
    msg = Array.isArray(first) ? first[0] : first;
  } else if (errorObj.extensions?.message) {
    msg = errorObj.extensions.message;
  } else if (errorObj.extensions?.debugMessage) {
    msg = errorObj.extensions.debugMessage;
  }

  // Nếu vẫn generic → thử tìm sâu hơn
  if (msg === "Có lỗi xảy ra" || msg === "Internal server error") {
    if (errorObj.extensions?.category) msg = errorObj.extensions.category;
    else if (errorObj.extensions?.originalMessage) msg = errorObj.extensions.originalMessage;
    else if (errorObj.extensions?.laravel?.message) msg = errorObj.extensions.laravel.message;
    else if (errorObj.extensions) {
      const bag = JSON.stringify(errorObj.extensions);
      const match = bag.match(/"message":\s*"([^"]+)"/);
      if (match && match[1] && match[1] !== "Internal server error") {
        msg = match[1];
      }
    }
  }

  return msg;
};

export const graphqlRequest = async (query, variables = {}) => {
  try {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await axios.post(
      GRAPHQL_URL,
      { query, variables },
      { headers }
    );

    // BE trả lỗi GraphQL dưới dạng response hợp lệ
    if (response.data.errors) {
      const err = response.data.errors[0];
      const message = extractErrorMessage(err);

      return {
        ...response.data,
        errors: [{ ...err, message }],
      };
    }

    return response.data;
  } catch (error) {
    // BE trả lỗi trong error.response
    if (error.response?.data?.errors) {
      const err = error.response.data.errors[0];
      const message = extractErrorMessage(err);

      return {
        ...error.response.data,
        errors: [{ ...err, message }],
      };
    }

    // Lỗi network thật
    return {
      errors: [
        {
          message: "Không thể kết nối server",
        },
      ],
    };
  }
};
