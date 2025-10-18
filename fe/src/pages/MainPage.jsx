import React from 'react';
import Sidebar from "../components/Sidebar";
import WidgetSidebar from "../components/WidgetSidebar";
import Feed from "../components/Feed";

export default function MainPage() {
  const dummyPosts = [
    {
      id: 1,
      user: "Alice",
      time: "2 hours ago",
      content: "This is a sample post content.",
      media:
        "<img src='/assets/images/sample.jpg' alt='sample' class='rounded-lg mt-2' />",
    },
    {
      id: 2,
      user: "Bob",
      time: "1 hour ago",
      content: "Another test post here.",
    },
  ];
  return (
    <div className="font-sans">
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Feed */}
          <Feed />

          {/* Right Sidebar */}
          <WidgetSidebar />
        </div>
      </div>
    </div>
  );
}
