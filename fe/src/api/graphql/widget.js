import graphqlClient from "./client";

// =======================
// 🗓️ EVENT QUERIES
// =======================
export const getTodayEvents = async () => {
  const query = `
    query {
      eventsToday {
        id
        title
        event_date
        location
        created_at
        created_by
      }
    }
  `;
  const res = await graphqlClient.post("", { query });
  return res.data.data?.eventsToday || [];
};

export const getAllEvents = async () => {
  const query = `
    query {
      events {
        id
        title
        event_date
        location
        created_at
        created_by
      }
    }
  `;

  try {
    const response = await graphqlClient.post("", { query });
    if (response.data.errors) {
      console.error("GraphQL Errors:", response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data?.events || [];
  } catch (err) {
    console.error("Failed fetching events:", err);
    return [];
  }
};

// =======================
// export const getEventById = async (id) => {
//   const query = `
//     query ($id: ID!) {
//       event(id: $id) {
//         id
//         title
//         event_date
//         location
//         created_at
//       }
//     }
//   `;
//   const variables = { id };
//   const response = await graphqlClient.post("", { query, variables });
//   return response.data.data.event;
// };

// =======================
// export const getEventsByUser = async (user_id) => {
//   const query = `
//     query ($user_id: ID!) {
//       eventsByUser(user_id: $user_id) {
//         id
//         title
//         event_date
//         location
//         created_at
//       }
//     }
//   `;
//   const variables = { user_id };
//   const response = await graphqlClient.post("", { query, variables });
//   return response.data.data.eventsByUser;
// };

// =======================
// ⏰ DEADLINE QUERIES
// =======================
export const getUpcomingDeadlines = async () => {
  const query = `
    query {
      upcomingDeadlines {
        id
        title
        deadline_date
        details
      }
    }
  `;
  const res = await graphqlClient.post("", { query });
  return res.data.data?.upcomingDeadlines || [];
};
export const getAllDeadlines = async () => {
  const query = `
    query {
      deadlines {
        id
        title
        deadline_date
        details
        created_at
        created_by
      }
    }
  `;
  try {
    const response = await graphqlClient.post("", { query });
    if (response.data.errors) {
      console.error("GraphQL Errors:", response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data?.deadlines || [];
  } catch (err) {
    console.error("Failed fetching deadlines:", err);
    return [];
  }
};

// =======================
// export const getDeadlineById = async (id) => {
//   const query = `
//     query ($id: ID!) {
//       deadline(id: $id) {
//         id
//         title
//         deadline_date
//         details
//         created_at
//       }
//     }
//   `;
//   const variables = { id };
//   const response = await graphqlClient.post("", { query, variables });
//   return response.data.data.deadline;
// };

// =======================
// export const getDeadlinesByUser = async (user_id) => {
//   const query = `
//     query ($user_id: ID!) {
//       deadlinesByUser(user_id: $user_id) {
//         id
//         title
//         deadline_date
//         details
//         created_at
//       }
//     }
//   `;
//   const variables = { user_id };
//   const response = await graphqlClient.post("", { query, variables });
//   return response.data.data.deadlinesByUser;
// };
