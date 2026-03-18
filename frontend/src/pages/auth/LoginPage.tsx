import { AuthForm } from "@/features/auth/AuthForm";

export function LoginPage(): JSX.Element {
  return (
    <div className="container grid min-h-screen items-center py-8 lg:grid-cols-[1fr_460px] lg:gap-10">
      <section className="hidden lg:block">
        <p className="mb-3 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Core MVP
        </p>
        <h1 className="mb-4 text-4xl font-bold leading-tight">Подготовка к экзаменам с AI-ассистентом</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Каталог курсов, персональный прогресс и чат с AI прямо внутри курса. Войдите, чтобы продолжить обучение.
        </p>
        <p className="mt-8 rounded-lg border border-border/70 bg-card/64 p-4 text-sm text-muted-foreground">
          Demo: <span className="font-semibold text-foreground">demo@student.ai / demo123</span>
        </p>
      </section>

      <section className="mx-auto w-full max-w-md animate-fade-in-up lg:mx-0">
        <AuthForm mode="login" />
      </section>
    </div>
  );
}
