import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import BrandicianLoader from "../common/BrandicianLoader";
import { useAutoFocus } from "../../hooks/useAutoFocus";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // User loading is handled globally in App.tsx to avoid duplicate requests
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useAutoFocus([user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
    );
  }

  return user ? <>{children}</> : null;
};

export default AuthGuard;
