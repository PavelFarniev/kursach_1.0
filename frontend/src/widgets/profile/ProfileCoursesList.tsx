import { ArrowUpRight, BookCheck, ChevronDown, ChevronUp, Clock8 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EnrollmentWithCourse } from "@/types/domain";

interface ProfileCoursesListProps {
  enrollments: EnrollmentWithCourse[];
}

export function ProfileCoursesList({ enrollments }: ProfileCoursesListProps): JSX.Element {
  const [openEnrollmentId, setOpenEnrollmentId] = useState<number | null>(null);

  useEffect(() => {
    if (enrollments.length === 0) {
      setOpenEnrollmentId(null);
      return;
    }

    if (openEnrollmentId !== null && !enrollments.some((enrollment) => enrollment.id === openEnrollmentId)) {
      setOpenEnrollmentId(null);
    }
  }, [enrollments, openEnrollmentId]);

  if (enrollments.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-card/58">
        <CardHeader>
          <CardTitle>Пока нет выбранных курсов</CardTitle>
          <CardDescription>Откройте каталог и начните обучение, чтобы отслеживать прогресс здесь.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {enrollments.map((enrollment) => {
        const isOpen = openEnrollmentId === enrollment.id;
        const actionLabel =
          enrollment.status === "completed"
            ? "Повторить курс"
            : enrollment.progressPercent > 0
              ? "Продолжить обучение"
              : "Начать курс";

        return (
          <Card key={enrollment.id} className="border-border/70 bg-card/68 transition hover:border-border hover:shadow-sm">
            <CardHeader className="pb-3">
              <button
                type="button"
                onClick={() => setOpenEnrollmentId((state) => (state === enrollment.id ? null : enrollment.id))}
                className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                    <Badge variant={enrollment.status === "completed" ? "success" : "warning"}>{enrollment.status}</Badge>
                  </div>
                  <CardDescription className="inline-flex items-center gap-2">
                    <BookCheck className="h-4 w-4" />
                    {enrollment.course.category} · {enrollment.course.level}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{enrollment.progressPercent}%</span>
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>
            </CardHeader>

            {isOpen ? (
              <CardContent className="space-y-3">
                <Progress value={enrollment.progressPercent} />
                <div className="flex items-center justify-between text-sm">
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <Clock8 className="h-4 w-4" />
                    Прогресс обучения
                  </p>
                  <p className="font-semibold">{enrollment.progressPercent}%</p>
                </div>

                <Button asChild variant="outline" size="sm" className="w-fit border-border/80 hover:bg-secondary/70">
                  <Link to={`/courses/${enrollment.course.id}`}>
                    <span>{actionLabel}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
