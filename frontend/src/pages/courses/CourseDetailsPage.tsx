import { ArrowLeft, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourseStore } from "@/store/courseStore";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { AIChatWidget } from "@/widgets/chat/AIChatWidget";
import { CourseNotesWidget } from "@/widgets/course/CourseNotesWidget";
import { ProgressWidget } from "@/widgets/course/ProgressWidget";

export function CourseDetailsPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);
  const navigate = useNavigate();

  const [actionLoading, setActionLoading] = useState(false);

  const selectedCourse = useCourseStore((state) => state.selectedCourse);
  const isLoadingCourse = useCourseStore((state) => state.isLoadingCourse);
  const courseError = useCourseStore((state) => state.error);
  const fetchCourseById = useCourseStore((state) => state.fetchCourseById);

  const enrollments = useEnrollmentStore((state) => state.enrollments);
  const fetchMyEnrollments = useEnrollmentStore((state) => state.fetchMyEnrollments);
  const enrollToCourse = useEnrollmentStore((state) => state.enrollToCourse);

  const enrollment = useMemo(() => enrollments.find((item) => item.courseId === courseId), [enrollments, courseId]);

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      return;
    }

    void fetchCourseById(courseId);
    void fetchMyEnrollments();
  }, [courseId, fetchCourseById, fetchMyEnrollments]);

  const handleOpenLearningPage = async (): Promise<void> => {
    if (!selectedCourse) {
      return;
    }

    setActionLoading(true);

    try {
      if (!enrollment) {
        await enrollToCourse(selectedCourse.id);
      }

      navigate(`/courses/${selectedCourse.id}/learn`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!Number.isFinite(courseId)) {
    return <p className="text-warning">Некорректный идентификатор курса</p>;
  }

  if (courseError) {
    return <p className="text-warning">{courseError}</p>;
  }

  if (isLoadingCourse || !selectedCourse || selectedCourse.id !== courseId) {
    return <p className="text-muted-foreground">Загружаем курс...</p>;
  }

  return (
    <section className="space-y-6 animate-fade-in-up">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link to="/courses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к каталогу
        </Link>
      </Button>

      <Card className="border-border/70 bg-card/68">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{selectedCourse.category}</Badge>
            <Badge>{selectedCourse.level}</Badge>
          </div>
          <CardTitle className="text-3xl">{selectedCourse.title}</CardTitle>
          <CardDescription className="max-w-3xl text-base">{selectedCourse.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void handleOpenLearningPage()} disabled={actionLoading}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {enrollment ? "Продолжить курс" : "Начать курс"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ProgressWidget
          mode="overview"
          progressPercent={enrollment?.progressPercent ?? 0}
          status={enrollment?.status ?? "active"}
          lessonsCount={selectedCourse.lessonsCount}
          isEnrolled={Boolean(enrollment)}
          onStartCourse={handleOpenLearningPage}
          onContinueCourse={handleOpenLearningPage}
        />

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full max-w-[420px] grid-cols-3">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="chat">AI-чат</TabsTrigger>
            <TabsTrigger value="notes">Заметки</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border-border/70 bg-card/72">
              <CardHeader>
                <CardTitle className="text-xl">Как проходить этот курс</CardTitle>
                <CardDescription>
                  Рекомендуем короткие сессии, регулярный разбор ошибок и консультации с AI-ассистентом после каждого блока.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. Изучайте 1-2 урока в день и фиксируйте сложные вопросы.</p>
                <p>2. После практики отправляйте в AI-чат вопросы по ошибкам.</p>
                <p>3. Доводите прогресс до 100% перед пробным экзаменом.</p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/72">
              <CardHeader>
                <CardTitle className="text-xl">Полный режим прохождения</CardTitle>
                <CardDescription>
                  Кнопки «Начать курс» и «Продолжить курс» открывают отдельную учебную страницу в формате обычных последовательных слайдов
                  с теорией и сохранением прогресса.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <AIChatWidget courseId={selectedCourse.id} courseTitle={selectedCourse.title} />
          </TabsContent>

          <TabsContent value="notes">
            <CourseNotesWidget courseId={selectedCourse.id} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
