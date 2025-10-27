import React, { useState, useEffect } from "react";
import { searchAll } from "../api/graphql/search";
import PostCard from "./PostCard"; // import your PostCard component

export default function SearchResult() {
  const [searchQuery, setSearchQuery] = useState("AI Ethics");
  const [filter, setFilter] = useState("All");
  const [results, setResults] = useState({ posts: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await searchAll(searchQuery);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchResults, 400); // debounce
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const filtered = () => {
    if (filter === "All") return [...results.posts, ...results.users];
    if (filter === "Events" || filter === "Clubs") {
      return results.posts.filter(
        (p) => p.type?.toLowerCase() === filter.toLowerCase()
      );
    }
    if (filter === "People") return results.users;
    return [];
  };

  const filteredResults = filtered();

  return (
    <main className="w-full lg:w-2/3">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <input
          type="text"
          placeholder="Search events, clubs, people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-600">
            Showing results for{" "}
            <span className="font-semibold">"{searchQuery}"</span>
          </p>
          <div className="flex space-x-2">
            {["All", "Events", "Clubs", "People"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filter === tab
                    ? "bg-cyan-100 text-cyan-700 font-semibold"
                    : "text-cyan-600 hover:bg-cyan-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : filteredResults.length === 0 ? (
        <p className="text-gray-500 text-center">No results found.</p>
      ) : (
        <div className="space-y-6">
          {filteredResults.map((item) =>
            // if it's a Post
            "content" in item ? (
              <PostCard
                key={item.id}
                post={{
                  id: item.id,
                  user: item.user?.name ?? "Anonymous",
                  time: new Date(item.created_at).toLocaleString(),
                  content: item.content,
                  media: item.media ?? [],
                }}
              />
            ) : (
              // if it's a User
              <div
                key={item.id}
                className="bg-white rounded-lg shadow p-4 flex items-center space-x-4 hover:bg-gray-50 transition"
              >
                <img
                  src={`https://api.dicebear.com/8.x/identicon/svg?seed=${item.name}`}
                  alt={item.name}
                  className="rounded-full h-12 w-12"
                />
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.email}</p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}
