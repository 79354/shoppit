import { Navigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { isUserAdmin } from "@/lib/services";
import { toast } from "sonner";

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function handleUserIsAdmin() {
      try {
        const response = await isUserAdmin();
        if (!response.is_admin) {
          toast.error("This page is only accessible to admins.");
        }
        setIsAdmin(response.is_admin);
      } catch (err: unknown) {
        console.error("Error checking admin user:", err);
        toast.error("Failed to verify admin access.");
      } finally {
        setLoading(false);
      }
    }

    handleUserIsAdmin();
  }, []); // ✅ only run once

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
