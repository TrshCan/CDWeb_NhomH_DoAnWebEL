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
  
  if (response.data.errors) {
    const error = response.data.errors[0];
    
    // Check for validation errors
    if (error.extensions?.validation) {
      const validationErrors = error.extensions.validation;
      const validationMessages = Object.values(validationErrors)
        .flat()
        .filter(msg => msg && msg.trim() !== '');
      
      if (validationMessages.length > 0) {
        const errorObj = new Error(validationMessages.join(', '));
        errorObj.graphQLErrors = response.data.errors;
        throw errorObj;
      }
    }
    
    // Throw general error
    const errorObj = new Error(error.message || "Search failed");
    errorObj.graphQLErrors = response.data.errors;
    throw errorObj;
  }
  
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
  
  try {
    const response = await graphqlClient.post("", { query: gqlQuery, variables });
    
    if (response.data.errors) {
      // Silently fail for suggestions - just return empty array
      console.warn("Suggestions fetch failed:", response.data.errors[0]?.message);
      return [];
    }
    
    const data = response.data.data?.search ?? { posts: [], users: [] };

    // Combine and clean results
    const combined = [
      ...data.posts.map((p) => p.content),
      ...data.users.map((u) => u.name),
    ];

    // Filter duplicates + limit to 5 suggestions
    return [...new Set(combined)].slice(0, 5);
  } catch (error) {
    // Silently fail for suggestions
    console.warn("Suggestions fetch error:", error);
    return [];
  }
};