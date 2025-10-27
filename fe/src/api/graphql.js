// fe/src/api/graphql.js
import axios from "axios";

const GRAPHQL_URL = "http://127.0.0.1:8000/graphql"; // thay bằng URL BE của bạn

export const graphqlRequest = async (query, variables = {}) => {
  try {
    const response = await axios.post(GRAPHQL_URL, { query, variables }, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
