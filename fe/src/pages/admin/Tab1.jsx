import React from "react";
import AdminSidebar from "../../components/AdminSidebar";

export default function Tab1() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tab 1</h1>
          <p className="text-gray-600">This is Tab 1 content page</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-100 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tab 1 Content</h2>
            <p className="text-gray-600 mb-6">
              Add your content here for Tab 1
            </p>
            <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
