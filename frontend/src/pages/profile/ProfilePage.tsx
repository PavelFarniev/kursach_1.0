import { Mail, ShieldCheck, User } from "lucide-react";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { PasswordChangeCard } from "@/widgets/profile/PasswordChangeCard";
import { ProfileCoursesList } from "@/widgets/profile/ProfileCoursesList";

export function ProfilePage(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const enrollments = useEnrollmentStore((state) => state.enrollments);
  const isLoading = useEnrollmentStore((state) => state.isLoading);
  const fetchMyEnrollments = useEnrollmentStore((state) => state.fetchMyEnrollments);

  useEffect(() => {
    void fetchMyEnrollments();
  }, [fetchMyEnrollments]);

  return (
    <section className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Личный кабинет
        </p>
        <h1 className="text-3xl font-bold">Профиль пользователя</h1>
        <p className="text-muted-foreground">Здесь отображаются ваши курсы, прогресс и текущий статус подготовки.</p>
      </div>

      <div className="space-y-5">
        <Card className="border-border/70 bg-card/72">
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>Данные аккаунта и образовательного трека</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p className="inline-flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.fullName ?? "Пользователь"}</span>
            </p>
            <p className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user?.email}</span>
            </p>
            {user?.isAdmin ? (
              <p className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-warning" />
                <Badge variant="warning">Администратор</Badge>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <PasswordChangeCard />

        <div className="space-y-3">
          <div className="h-px w-full bg-border/80" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Мои курсы</p>
            <p className="text-sm text-muted-foreground">Активные и завершенные курсы с текущим прогрессом и быстрым переходом.</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загружаем ваши курсы...</p>
      ) : (
        <ProfileCoursesList enrollments={enrollments} />
      )}
    </section>
  );
}
