// src/api/graphql/client.js

import axios from "axios";

const graphqlClient = axios.create({
  baseURL: "http://localhost:8000/graphql",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token if available
graphqlClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default graphqlClient;
