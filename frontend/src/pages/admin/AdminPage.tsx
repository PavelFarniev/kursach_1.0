import { ShieldCheck, Users } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCoursesSection } from "@/pages/admin/AdminCoursesSection";
import { AdminUsersSection } from "@/pages/admin/AdminUsersPage";

type AdminSection = "users" | "courses";

const getAdminSection = (value: string | null): AdminSection => (value === "courses" ? "courses" : "users");

export function AdminPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = getAdminSection(searchParams.get("section"));

  useEffect(() => {
    const currentValue = searchParams.get("section");
    if (currentValue === "users" || currentValue === "courses") {
      return;
    }

    setSearchParams({ section: "users" }, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSectionChange = (nextSection: AdminSection): void => {
    setSearchParams({ section: nextSection });
  };

  return (
    <section className="space-y-6 animate-fade-in-up">
      <Card className="border-border/70 bg-card/72">
        <CardHeader className="space-y-4">
          <div className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Admin V2
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Единая админка</CardTitle>
            <CardDescription className="max-w-3xl text-base">
              Переключайтесь между управлением пользователями и курсами без отдельного экрана. Активный раздел хранится в
              query-параметре, поэтому состояние страницы удобно шарить прямой ссылкой.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              size="lg"
              variant={section === "users" ? "default" : "outline"}
              onClick={() => handleSectionChange("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Пользователи
            </Button>
            <Button
              size="lg"
              variant={section === "courses" ? "default" : "outline"}
              onClick={() => handleSectionChange("courses")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Курсы
            </Button>
          </div>
        </CardContent>
      </Card>

      {section === "users" ? <AdminUsersSection /> : <AdminCoursesSection />}
    </section>
  );
}
