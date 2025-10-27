// src/api/graphql/client.js

import axios from "axios";

const graphqlClient = axios.create({
  baseURL: "http://localhost:8000/graphql", // or your deployed URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default graphqlClient;
