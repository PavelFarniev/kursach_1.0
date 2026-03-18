import { ArrowRight, Bot, BookOpen, ChartNoAxesColumn } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { LearningPulsePanel } from "@/widgets/landing/LearningPulsePanel";
import { UnifiedHeader } from "@/widgets/layout/UnifiedHeader";

export function LandingPage(): JSX.Element {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen">
      <UnifiedHeader />

      <main className="container py-10 md:py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              AI-платформа для подготовки
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">Готовьтесь к экзаменам системно и с поддержкой AI</h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              Выбирайте курс, отслеживайте прогресс, задавайте вопросы AI-ассистенту внутри обучения и двигайтесь к результату по понятному плану.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to={user ? "/courses" : "/register"}>
                  {user ? "Перейти к курсам" : "Начать бесплатно"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={user ? "/profile" : "/login"}>{user ? "Открыть профиль" : "У меня уже есть аккаунт"}</Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/70 bg-card/68">
            <CardHeader>
              <CardTitle>Что уже доступно на KillExam</CardTitle>
              <CardDescription>
                Здесь вы можете выбрать курс, отслеживать свой прогресс и в любой момент обращаться к AI-ассистенту за разбором тем и задач.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5 text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Каталог курсов и страница курса</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5 text-foreground">
                <ChartNoAxesColumn className="h-4 w-4 text-primary" />
                <span>Прогресс обучения по каждому курсу</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5 text-foreground">
                <Bot className="h-4 w-4 text-primary" />
                <span>AI-чат внутри курса</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 animate-fade-in-up">
          <LearningPulsePanel />
        </section>
      </main>
    </div>
  );
}
