import axios from "axios";

const GRAPHQL_URL = "http://127.0.0.1:8000/graphql";

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

    // Nếu GraphQL trả lỗi → ném ra FE
    if (response.data?.errors?.length) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data;

  } catch (err) {
    // Lỗi backend Laravel (axios có response)
    if (err.response?.data?.errors?.length) {
      throw new Error(err.response.data.errors[0].message);
    }

    // Lỗi network thật
    if (err.message === "Network Error") {
      throw new Error("Không thể kết nối đến server");
    }

    // Lỗi khác
    throw new Error(err.message || "Lỗi không xác định");
  }
};
