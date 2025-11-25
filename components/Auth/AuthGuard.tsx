import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import Loader from '../ui/Loader';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Outlet />;
};

export const PublicRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    if (user) return <Navigate to="/chat" replace />;
    return <Outlet />;
};