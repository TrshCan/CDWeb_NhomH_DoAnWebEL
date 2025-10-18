// src/components/Feed.jsx
import { useEffect, useState } from "react";
import { graphqlRequest } from "../graphqlClient";

const GET_POSTS = `
  query GetPosts {
    posts {
      id
      content
      media_url
      created_at
      user {
        id
        name
      }
    }
  }
`;

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await graphqlRequest(GET_POSTS);
        setPosts(data.posts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  if (loading)
    return <p className="text-gray-500 text-center">Loading posts...</p>;
  if (error)
    return <p className="text-red-500 text-center">Error: {error}</p>;

  return (
    <main className="w-full lg:w-2/3 space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-cyan-600 rounded-full"></div>
            <div>
              <p className="font-semibold text-cyan-600">
                {post.user?.name ?? "Unknown User"}
              </p>
              <p className="text-gray-500 text-sm">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <p className="mt-2">{post.content}</p>
          {post.media_url && (
            <img
              src={post.media_url}
              alt="Post media"
              className="mt-2 rounded-lg max-h-96 object-cover"
            />
          )}

          <div className="flex space-x-4 mt-2 text-gray-500">
            <button className="hover:text-cyan-600">❤️</button>
            <button className="hover:text-cyan-600">💬</button>
            <button className="hover:text-cyan-600">🔁</button>
          </div>
        </div>
      ))}
    </main>
  );
}
