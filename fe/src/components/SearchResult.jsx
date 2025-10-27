import React, { useState, useEffect } from "react";
import { searchAll, fetchSuggestions } from "../api/graphql/search";
import PostCard from "./PostCard";
import "../assets/css/search.css"; // 👈 import the shimmer + fade css

export default function SearchResult() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [results, setResults] = useState({ posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false); // 👈 for smooth fade

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const data = await fetchSuggestions(searchQuery);
      setSuggestions(data);
      setShowSuggestions(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ posts: [], users: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setFadeIn(false);
      try {
        const data = await searchAll(searchQuery);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 100); // 👈 small delay for fade-in
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const filteredResults = (() => {
    switch (filter) {
      case "Post":
        return results.posts;
      case "User":
        return results.users;
      default:
        return [...results.posts, ...results.users];
    }
  })();

  // Skeleton Loader
  const Skeleton = ({ type }) => {
    if (type === "post") {
      return (
        <div className="skeleton-card animate-shimmer">
          <div className="skeleton-title shimmer"></div>
          <div className="skeleton-line shimmer"></div>
          <div className="skeleton-line shimmer"></div>
          <div className="skeleton-img shimmer"></div>
        </div>
      );
    }
    return (
      <div className="skeleton-user animate-shimmer">
        <div className="skeleton-avatar shimmer"></div>
        <div className="skeleton-info">
          <div className="skeleton-line shimmer"></div>
          <div className="skeleton-line short shimmer"></div>
        </div>
      </div>
    );
  };

  return (
    <main className="w-full lg:w-2/3">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-50 bg-white rounded-lg shadow p-4 mb-4">
        <input
          type="text"
          placeholder="Search posts or users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute bg-white border border-gray-200 rounded-lg shadow-md w-full mt-1 z-50 max-h-48 overflow-y-auto">
            {suggestions.map((item, i) => (
              <li
                key={i}
                onClick={() => {
                  setSearchQuery(item);
                  setShowSuggestions(false);
                }}
                className="px-4 py-2 hover:bg-cyan-50 cursor-pointer text-gray-700"
              >
                {item.length > 60 ? item.slice(0, 60) + "..." : item}
              </li>
            ))}
          </ul>
        )}

        {/* Filters */}
        <div className="flex justify-between items-center mt-2">
          {searchQuery && (
            <p className="text-sm text-gray-600">
              Showing results for{" "}
              <span className="font-semibold">
                "
                {searchQuery.length > 50
                  ? `${searchQuery.slice(0, 50)}...`
                  : searchQuery}
                "
              </span>
            </p>
          )}
          <div className="flex space-x-2">
            {["All", "Post", "User"].map((tab) => (
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
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} type={filter === "User" ? "user" : "post"} />
          ))}
        </div>
      ) : !searchQuery ? (
        <p className="text-gray-400 text-center italic">
          Start typing to search 🔍
        </p>
      ) : filteredResults.length === 0 ? (
        <p className="text-gray-500 text-center">No results found.</p>
      ) : (
        <div className={`space-y-6 fade-in ${fadeIn ? "visible" : ""}`}>
          {filteredResults.map((item) =>
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
