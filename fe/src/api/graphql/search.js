import graphqlClient from "./client";

export const searchAll = async (query) => {
  const gqlQuery = `
    query ($query: String!) {
      search(query: $query) {
        posts {
          id
          type
          content
          created_at
          user {
            id
            name
          }
          media {
            id
            url
          }
        }
        users {
          id
          name
          email
        }
      }
    }
  `;

  const variables = { query };
  const response = await graphqlClient.post("", { query: gqlQuery, variables });
  return response.data.data.search;
};
