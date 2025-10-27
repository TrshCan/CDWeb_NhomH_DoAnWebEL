import React from 'react';
import Sidebar from "../components/Sidebar";
import WidgetSidebar from "../components/WidgetSidebar";
import Group from "../components/Group";

export default function MainPage() {

  return (
    <div className="font-sans">
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Group */}
          <Group />

          {/* Right Sidebar */}
          <WidgetSidebar />
        </div>
      </div>
    </div>
  );
}
