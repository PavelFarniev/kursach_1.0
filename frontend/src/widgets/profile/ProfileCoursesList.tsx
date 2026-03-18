import { ArrowUpRight, BookCheck, Clock8 } from "lucide-react";
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
        const actionLabel =
          enrollment.status === "completed"
            ? "Повторить курс"
            : enrollment.progressPercent > 0
              ? "Продолжить обучение"
              : "Начать курс";

        return (
          <Card key={enrollment.id} className="border-border/70 bg-card/68 transition hover:border-border hover:shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">
                  <Link to={`/courses/${enrollment.course.id}`} className="transition hover:text-primary">
                    {enrollment.course.title}
                  </Link>
                </CardTitle>
                <Badge variant={enrollment.status === "completed" ? "success" : "warning"}>{enrollment.status}</Badge>
              </div>
              <CardDescription className="inline-flex items-center gap-2">
                <BookCheck className="h-4 w-4" />
                {enrollment.course.category} · {enrollment.course.level}
              </CardDescription>
            </CardHeader>

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
          </Card>
        );
      })}
    </div>
  );
}
