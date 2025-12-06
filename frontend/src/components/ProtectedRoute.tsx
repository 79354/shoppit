import { Navigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { isUserLoggedIn } from "@/lib/services";
import { toast } from "sonner";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function handleIsAuthenticated() {
      try {
        const response = await isUserLoggedIn();
        setIsAuth(response.is_logged_in);
        if (!response.is_logged_in) toast.error("You have to be logged in!");
      } catch (err: unknown) {
        console.error("Error checking login status:", err);
        toast.error("Failed to verify authentication.");
      } finally {
        setLoading(false);
      }
    }

    handleIsAuthenticated();
  }, []); // ✅ only run once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
