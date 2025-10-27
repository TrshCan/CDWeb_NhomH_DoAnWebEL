// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Register from './pages/Register';
import Login from './pages/Login.jsx';
import UserManagement from "./pages/UserManagement.jsx";
import Feed from "./components/Feed.jsx";

export default function App() {
  return (

      <Routes>
          {/* Layout chính*/}
        <Route path="/" element={<MainPage />} >

          {/* route con trong layout */}
          <Route index element={<Feed />} /> {/* mặc định là Feed */}
            <Route path="profile" element={<UserManagement />} />
            {/*<Route path="explore" element={<Explore />} />*/}
        </Route>
        <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
      </Routes>

  );
}