import { Navigate, BrowserRouter, Route, Routes } from "react-router-dom";

import { AdminPage } from "@/pages/admin/AdminPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { CourseDetailsPage } from "@/pages/courses/CourseDetailsPage";
import { CourseLearningPage } from "@/pages/courses/CourseLearningPage";
import { CoursesPage } from "@/pages/courses/CoursesPage";
import { LandingPage } from "@/pages/LandingPage";
import { AdminRoute } from "@/routes/AdminRoute";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute";
import { AppShell } from "@/widgets/layout/AppShell";

export function AppRouter(): JSX.Element {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailsPage />} />
            <Route path="/courses/:id/learn" element={<CourseLearningPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/users" element={<Navigate to="/admin?section=users" replace />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
