import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/types/domain";
import { ModuleQuizCard, parseModuleQuiz } from "@/widgets/course/ModuleQuizCard";

interface CourseSlidesDeckProps {
  course: Course;
  currentIndex: number;
  onSlideChange: (nextIndex: number) => void;
}

export function CourseSlidesDeck({ course, currentIndex, onSlideChange }: CourseSlidesDeckProps): JSX.Element {
  const slides = course.slides ?? [];
  const safeCurrentIndex = Math.min(Math.max(0, currentIndex), Math.max(0, slides.length - 1));
  const currentSlide = useMemo(() => slides[safeCurrentIndex] ?? null, [safeCurrentIndex, slides]);
  const moduleQuiz = useMemo(() => (currentSlide ? parseModuleQuiz(currentSlide.practiceTask) : null), [currentSlide]);
  const isFirstSlide = safeCurrentIndex === 0;
  const isLastSlide = safeCurrentIndex === slides.length - 1;

  if (!currentSlide) {
    return (
      <Card className="border-border/70 bg-card/72">
        <CardHeader>
          <CardTitle className="text-xl">Учебные материалы готовятся</CardTitle>
          <CardDescription>Для этого курса пока нет загруженных учебных слайдов.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 xl:mx-0 xl:max-w-[880px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Слайд {String(currentIndex + 1).padStart(2, "0")} из {String(slides.length).padStart(2, "0")}
        </p>

        <div className="flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => onSlideChange(index)}
              className={`h-2.5 rounded-full transition ${
                index === safeCurrentIndex ? "w-8 bg-primary" : "w-2.5 bg-border hover:bg-primary/40"
              }`}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
        <CardHeader className="space-y-6 border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.9))] px-6 pb-6 pt-6 dark:bg-[linear-gradient(180deg,rgba(29,43,61,0.98),rgba(34,50,69,0.94))] md:px-10 md:pb-8 md:pt-8">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{course.category}</p>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70 dark:text-primary/85">
                  Слайд {String(safeCurrentIndex + 1).padStart(2, "0")}
                </p>
                <CardTitle className="max-w-3xl text-3xl leading-tight text-foreground dark:text-foreground md:text-5xl">
                  {currentSlide.title}
                </CardTitle>
                <CardDescription className="max-w-3xl text-lg leading-8 text-foreground/80 dark:text-foreground/84">
                  {currentSlide.summary}
                </CardDescription>
              </div>
            </div>

            <div className="hidden shrink-0 text-6xl font-bold tracking-tight text-primary/10 dark:text-primary/15 md:block">
              {String(safeCurrentIndex + 1).padStart(2, "0")}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 py-6 md:px-10 md:py-8">
          <div className="space-y-5">
            {currentSlide.theoryBlocks.map((paragraph) => (
              <p key={paragraph} className="text-[17px] leading-8 text-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/25 px-6 py-5">
            <p className="mb-4 text-sm font-semibold text-foreground">Ключевые мысли</p>
            <ul className="space-y-3">
              {currentSlide.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <p className="text-base leading-7 text-foreground">{bullet}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 px-6 py-5">
            <p className="text-sm font-semibold text-foreground">Пример</p>
            <p className="text-base leading-7 text-muted-foreground">{currentSlide.example}</p>
          </div>

          {moduleQuiz ? (
            <ModuleQuizCard key={currentSlide.id} quiz={moduleQuiz} />
          ) : (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/10 px-6 py-5">
              <p className="text-sm font-semibold text-foreground">Вопрос для самопроверки</p>
              <p className="text-base leading-7 text-muted-foreground">{currentSlide.practiceTask}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => onSlideChange(Math.max(0, safeCurrentIndex - 1))} disabled={isFirstSlide}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <p className="text-sm text-muted-foreground">Один слайд за раз: сначала прочитайте теорию, затем переходите к следующему блоку.</p>

        <Button onClick={() => onSlideChange(Math.min(slides.length - 1, safeCurrentIndex + 1))} disabled={isLastSlide}>
          Дальше
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
