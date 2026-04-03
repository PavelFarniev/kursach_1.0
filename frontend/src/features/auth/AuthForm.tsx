import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useCourseNotesStore } from "@/store/courseNotesStore";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
}

interface RegisterFields {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

interface LoginFields {
  email: string;
  password: string;
}

const isEmailValid = (email: string): boolean =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());

export function AuthForm({ mode }: AuthFormProps): JSX.Element {
  const navigate = useNavigate();
  const isLoading = useAuthStore((state) => state.isLoading);
  const apiError = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);
  const bootstrapNotes = useCourseNotesStore((state) => state.bootstrap);

  const [formError, setFormError] = useState<string | null>(null);
  const [loginValues, setLoginValues] = useState<LoginFields>({ email: "", password: "" });
  const [registerValues, setRegisterValues] = useState<RegisterFields>({
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });

  const title = useMemo(() => (mode === "login" ? "Вход в платформу" : "Создание аккаунта"), [mode]);
  const description = useMemo(
    () =>
      mode === "login"
        ? "Продолжите подготовку и вернитесь к своему прогрессу"
        : "Зарегистрируйтесь и начните обучение с AI-ассистентом",
    [mode],
  );

  const validate = (): boolean => {
    clearError();
    setFormError(null);

    if (mode === "login") {
      if (!isEmailValid(loginValues.email)) {
        setFormError("Введите корректный email");
        return false;
      }

      if (loginValues.password.trim().length < 6) {
        setFormError("Пароль должен содержать минимум 6 символов");
        return false;
      }

      return true;
    }

    if (!isEmailValid(registerValues.email)) {
      setFormError("Введите корректный email");
      return false;
    }

    if (registerValues.fullName.trim().length < 2) {
      setFormError("Имя должно содержать минимум 2 символа");
      return false;
    }

    if (registerValues.password.trim().length < 6) {
      setFormError("Пароль должен содержать минимум 6 символов");
      return false;
    }

    if (registerValues.password !== registerValues.confirmPassword) {
      setFormError("Пароли не совпадают");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (mode === "login") {
        await login({
          email: loginValues.email.trim(),
          password: loginValues.password,
        });
      } else {
        await register({
          email: registerValues.email.trim(),
          fullName: registerValues.fullName.trim(),
          password: registerValues.password,
        });
      }

      await bootstrapNotes();
      navigate("/courses");
    } catch {
      // Error message comes from store.
    }
  };

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/72 shadow-lg shadow-sky-950/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Имя и фамилия</Label>
              <Input
                id="fullName"
                placeholder="Иван Петров"
                value={registerValues.fullName}
                onChange={(event) => setRegisterValues((state) => ({ ...state, fullName: event.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={mode === "login" ? loginValues.email : registerValues.email}
              onChange={(event) => {
                const email = event.target.value;
                if (mode === "login") {
                  setLoginValues((state) => ({ ...state, email }));
                } else {
                  setRegisterValues((state) => ({ ...state, email }));
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Минимум 6 символов"
              value={mode === "login" ? loginValues.password : registerValues.password}
              onChange={(event) => {
                const password = event.target.value;
                if (mode === "login") {
                  setLoginValues((state) => ({ ...state, password }));
                } else {
                  setRegisterValues((state) => ({ ...state, password }));
                }
              }}
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                value={registerValues.confirmPassword}
                onChange={(event) =>
                  setRegisterValues((state) => ({ ...state, confirmPassword: event.target.value }))
                }
              />
            </div>
          )}

          {(formError || apiError) && (
            <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              {formError ?? apiError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Подождите..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <Link className="font-semibold text-primary hover:underline" to={mode === "login" ? "/register" : "/login"}>
              {mode === "login" ? "Регистрация" : "Войти"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
