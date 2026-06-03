import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

export function AdminRoute(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/courses" replace />;
  }

  return <Outlet />;
}
