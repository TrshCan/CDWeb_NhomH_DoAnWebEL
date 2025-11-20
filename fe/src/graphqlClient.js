// src/graphqlClient.js
import axios from "axios";

const graphqlClient = axios.create({
  baseURL: "http://localhost:8000/graphql", // change to your Laravel URL
  headers: {
    "Content-Type": "application/json",
  },
});

export async function graphqlRequest(query, variables = {}) {
  try {
    const response = await graphqlClient.post("", {
      query,
      variables,
    });
    if (response.data.errors) {
      console.error("GraphQL Errors:", response.data.errors);
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  } catch (error) {
    console.error("GraphQL Request Failed:", error);
    throw error;
  }
}
