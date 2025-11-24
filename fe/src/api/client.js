// src/api/graphql/client.js

import axios from "axios";

const graphqlClient = axios.create({
  baseURL: import.meta.env.VITE_GRAPHQL_URL || "/graphql",
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động thêm token vào header
graphqlClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Không set Content-Type cho FormData, để browser tự set với boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default graphqlClient;
