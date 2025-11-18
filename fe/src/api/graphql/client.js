// src/api/graphql/client.js

import axios from "axios";

const graphqlClient = axios.create({
  baseURL: "http://localhost:8000/graphql", // or your deployed URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization header from localStorage token for authenticated requests
graphqlClient.interceptors.request.use(
  (config) => {
    try {
      const token = window.localStorage.getItem("token");
      if (token) {
        // Use Bearer token scheme (common for Laravel JWT/Passport)
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Fail silently if localStorage is not available
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default graphqlClient;
