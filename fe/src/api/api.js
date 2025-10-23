import axios from 'axios';

const API_URL = 'http://localhost:8000/graphql';

export const graphqlRequest = async (query, variables = {}, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await axios.post(API_URL, {
    query,
    variables
  }, { headers });

  return response.data;
};
