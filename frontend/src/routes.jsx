import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import all page components
import HomePage from './pages/HomePage';
import SearchResults from './pages/SearchResults';
import ArticleView from './pages/ArticleView';
import TopicPage from './pages/TopicPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfile from './pages/UserProfile';
import NotFoundPage from './pages/NotFoundPage';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/article/:id" element={<ArticleView />} />
      <Route path="/topic/:topicId" element={<TopicPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/saved" 
        element={
          <ProtectedRoute>
            <UserProfile activeTab="saved" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <UserProfile activeTab="history" />
          </ProtectedRoute>
        } 
      />
      
      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;