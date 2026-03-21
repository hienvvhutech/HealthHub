import React from "react";
import { Route, Redirect } from "react-router-dom";

interface ProtectedRouteProps {
  component: React.ComponentType<object>;
  path: string;
  exact?: boolean;
  requiredRole: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  path,
  exact = false,
  requiredRole,
}) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // ✅ Dùng localStorage an toàn hơn

  const isAuthenticated = !!token && role === requiredRole;

  return isAuthenticated ? (
    <Route path={path} exact={exact} component={Component} />
  ) : (
    <Redirect to="/login" />
  );
};

export default ProtectedRoute;
