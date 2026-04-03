import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const INITIAL_STATE: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordChangeCard(): JSX.Element {
  const [values, setValues] = useState<PasswordFormState>(INITIAL_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLoading = useAuthStore((state) => state.isLoading);
  const apiError = useAuthStore((state) => state.error);
  const changePassword = useAuthStore((state) => state.changePassword);
  const clearError = useAuthStore((state) => state.clearError);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    clearError();
    setFormError(null);
    setSuccessMessage(null);

    if (values.currentPassword.trim().length < 6) {
      setFormError("Введите текущий пароль");
      return;
    }

    if (values.newPassword.trim().length < 6) {
      setFormError("Новый пароль должен содержать минимум 6 символов");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setFormError("Новый пароль и подтверждение не совпадают");
      return;
    }

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setValues(INITIAL_STATE);
      setSuccessMessage("Пароль обновлен. Текущая сессия продолжена с новыми токенами.");
    } catch {
      // Error text is shown from store.
    }
  };

  return (
    <Card className="border-border/70 bg-card/72">
      <CardHeader>
        <CardTitle>Смена пароля</CardTitle>
        <CardDescription>Обновите пароль аккаунта. После смены старые сессии будут отозваны.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="currentPassword">Текущий пароль</Label>
            <Input
              id="currentPassword"
              type="password"
              value={values.currentPassword}
              onChange={(event) => setValues((state) => ({ ...state, currentPassword: event.target.value }))}
              placeholder="Введите текущий пароль"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Новый пароль</Label>
            <Input
              id="newPassword"
              type="password"
              value={values.newPassword}
              onChange={(event) => setValues((state) => ({ ...state, newPassword: event.target.value }))}
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Подтвердите новый пароль</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={values.confirmPassword}
              onChange={(event) => setValues((state) => ({ ...state, confirmPassword: event.target.value }))}
              placeholder="Повторите новый пароль"
            />
          </div>

          {formError || apiError ? (
            <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning md:col-span-2">
              {formError ?? apiError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success md:col-span-2">
              {successMessage}
            </p>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сохраняем..." : "Сменить пароль"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
