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


export const fetchSuggestions = async (query) => {
  if (!query.trim()) return [];

  const gqlQuery = `
    query ($query: String!) {
      search(query: $query) {
        posts {
          content
        }
        users {
          name
        }
      }
    }
  `;
  const variables = { query };
  const response = await graphqlClient.post("", { query: gqlQuery, variables });
  const data = response.data.data?.search ?? { posts: [], users: [] };

  // Combine and clean results
  const combined = [
    ...data.posts.map((p) => p.content),
    ...data.users.map((u) => u.name),
  ];

  // Filter duplicates + limit to 5 suggestions
  return [...new Set(combined)].slice(0, 5);
};