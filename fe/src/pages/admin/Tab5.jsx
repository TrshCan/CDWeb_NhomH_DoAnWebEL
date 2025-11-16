import React from "react";
import AdminSidebar from "../../components/AdminSidebar";

export default function Tab5() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tab 5</h1>
          <p className="text-gray-600">This is Tab 5 content page</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tab 5 Content</h2>
            <p className="text-gray-600 mb-6">
              Add your content here for Tab 5
            </p>
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
