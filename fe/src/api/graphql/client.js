// src/api/graphql/client.js

import axios from "axios";

const graphqlClient = axios.create({
  baseURL: "http://localhost:8000/graphql",
  headers: {
    "Content-Type": "application/json",
  },
});

graphqlClient.interceptors.request.use(
  (config) => {
    // Safely read token
    try {
      const token = window.localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore if localStorage unavailable
    }

    // IMPORTANT: Allow FormData to auto-set correct Content-Type
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default graphqlClient;
