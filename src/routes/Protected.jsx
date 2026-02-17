import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth/AuthContext.jsx";

export default function Protected({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

