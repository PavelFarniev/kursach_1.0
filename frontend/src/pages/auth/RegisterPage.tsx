import { AuthForm } from "@/features/auth/AuthForm";

export function RegisterPage(): JSX.Element {
  return (
    <div className="container grid min-h-screen items-center py-8 lg:grid-cols-[1fr_460px] lg:gap-10">
      <section className="hidden lg:block">
        <p className="mb-3 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Starter Flow
        </p>
        <h1 className="mb-4 text-4xl font-bold leading-tight">Создайте аккаунт и начните учиться по персональному плану</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          После регистрации вы получите доступ к каталогу курсов, прогрессу и AI-помощнику для разбора сложных тем.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md animate-fade-in-up lg:mx-0">
        <AuthForm mode="register" />
      </section>
    </div>
  );
}
