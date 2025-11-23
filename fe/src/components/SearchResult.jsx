import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchAll, fetchSuggestions } from "../api/graphql/search";
import PostCard from "./PostCard";
import "../assets/css/search.css";

export default function SearchResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParam = new URLSearchParams(location.search).get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [filter, setFilter] = useState("All");
  const [results, setResults] = useState({ posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Whenever URL changes, update searchQuery
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q") || "";
    setSearchQuery(q);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [location.search]);

  // Handle keyboard navigation and Enter
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setShowSuggestions(false);
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const selected = suggestions[selectedIndex];
          navigate(`/search?q=${encodeURIComponent(selected)}`);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        } else if (searchQuery.trim()) {
          setShowSuggestions(false);
          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Fetch suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    setLoadingSuggestions(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await fetchSuggestions(searchQuery);
        setSuggestions(data);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      setLoadingSuggestions(false);
    };
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ posts: [], users: [] });
      setVisibleCount(10);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setFadeIn(false);
      try {
        const data = await searchAll(searchQuery);
        setResults(data);
        setVisibleCount(10);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 100);
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

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && !loadingMore) {
          if (visibleCount < filteredResults.length) {
            setLoadingMore(true);
            setTimeout(() => {
              setVisibleCount((c) => Math.min(c + 10, filteredResults.length));
              setLoadingMore(false);
            }, 500);
          }
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredResults.length, loading, loadingMore, visibleCount]);

  const Skeleton = ({ type }) =>
    type === "post" ? (
      <div className="skeleton-card animate-shimmer">
        <div className="skeleton-title shimmer"></div>
        <div className="skeleton-line shimmer"></div>
        <div className="skeleton-line shimmer"></div>
        <div className="skeleton-img shimmer"></div>
      </div>
    ) : (
      <div className="skeleton-user animate-shimmer">
        <div className="skeleton-avatar shimmer"></div>
        <div className="skeleton-info">
          <div className="skeleton-line shimmer"></div>
          <div className="skeleton-line short shimmer"></div>
        </div>
      </div>
    );

  return (
    <main className="w-full lg:w-2/3">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-50 bg-white rounded-lg shadow p-4 mb-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts or users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() =>
              setTimeout(() => {
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }, 200)
            }
            className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 transition-all"
            autoComplete="off"
          />
          {loadingSuggestions && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin h-5 w-5 text-cyan-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-2 z-50 max-h-64 overflow-y-auto custom-scrollbar">
            {suggestions.map((item, i) => (
              <li
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigate(`/search?q=${encodeURIComponent(item)}`);
                  setShowSuggestions(false);
                  setSelectedIndex(-1);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`px-4 py-3 cursor-pointer text-gray-700 transition-colors flex items-center space-x-2 ${
                  selectedIndex === i
                    ? "bg-cyan-100 text-cyan-900"
                    : "hover:bg-cyan-50"
                }`}
              >
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="flex-1 truncate">
                  {item.length > 70 ? item.slice(0, 70) + "..." : item}
                </span>
                {selectedIndex === i && (
                  <kbd className="px-2 py-0.5 text-xs bg-gray-200 rounded text-gray-600">
                    Enter
                  </kbd>
                )}
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
          {filteredResults.slice(0, visibleCount).map((item) =>
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
          {/* Sentinel for infinite scroll */}
          <div ref={loadMoreRef} />
          {loadingMore && (
            <div className="space-y-6 mt-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} type={filter === "User" ? "user" : "post"} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
