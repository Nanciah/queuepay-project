import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Vérifier les rôles
  if (roles.length > 0 && !roles.includes(user?.role)) {
    // Rediriger vers le dashboard approprié
    const redirectMap = {
      super_admin: '/super-admin/dashboard',
      company_admin: '/company-admin/dashboard',
      agent: '/agent/dashboard',
      client: '/client/home',
    };
    return <Navigate to={redirectMap[user?.role] || '/'} />;
  }

  return children;
};

export default PrivateRoute;