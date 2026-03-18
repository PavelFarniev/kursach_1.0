import { BookMarked, Clock3, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/types/domain";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps): JSX.Element {
  return (
    <Card className="flex h-full flex-col border-border/70 bg-card/68 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-900/5">
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{course.category}</Badge>
          <Badge>{course.level}</Badge>
        </div>
        <CardTitle className="text-xl">{course.title}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-2 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <Layers3 className="h-4 w-4" />
          {course.lessonsCount} уроков
        </p>
        <p className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          ~ {course.estimatedHours} часов
        </p>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link to={`/courses/${course.id}`}>
            <BookMarked className="mr-2 h-4 w-4" />
            Открыть курс
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
