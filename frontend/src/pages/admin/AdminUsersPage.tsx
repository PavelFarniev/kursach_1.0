import {
  PencilLine,
  Save,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/services/api/adminApi";
import { useAuthStore } from "@/store/authStore";
import type { UpdateAdminUserPayload } from "@/types/api";
import type { AdminUser } from "@/types/domain";

interface EditFormState {
  email: string;
  fullName: string;
  isActive: boolean;
  isAdmin: boolean;
}

const EMPTY_USERS: AdminUser[] = [];

const buildEditForm = (user: AdminUser): EditFormState => ({
  email: user.email,
  fullName: user.fullName,
  isActive: user.isActive,
  isAdmin: user.isAdmin,
});

const formatDate = (value: string): string =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function AdminUsersSection(): JSX.Element {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AdminUser[]>(EMPTY_USERS);
  const [searchDraft, setSearchDraft] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const adminCount = useMemo(() => users.filter((user) => user.isAdmin).length, [users]);
  const activeCount = useMemo(() => users.filter((user) => user.isActive).length, [users]);

  const loadUsers = async (search = activeSearch): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const nextUsers = await adminApi.listUsers({ search });
      setUsers(nextUsers);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Не удалось загрузить пользователей";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers("");
  }, []);

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextSearch = searchDraft.trim();
    setActiveSearch(nextSearch);
    await loadUsers(nextSearch);
  };

  const handleStartEdit = (user: AdminUser): void => {
    setEditingUserId(user.id);
    setEditForm(buildEditForm(user));
    setError(null);
  };

  const handleCancelEdit = (): void => {
    setEditingUserId(null);
    setEditForm(null);
  };

  const syncCurrentUser = (updatedUser: AdminUser): void => {
    if (currentUser?.id !== updatedUser.id) {
      return;
    }

    useAuthStore.setState((state) => ({
      ...state,
      user: state.user
        ? {
            ...state.user,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            isAdmin: updatedUser.isAdmin,
          }
        : state.user,
    }));
  };

  const replaceUserInList = (updatedUser: AdminUser): void => {
    setUsers((state) => state.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    syncCurrentUser(updatedUser);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editForm || editingUserId === null) {
      return;
    }

    const payload: UpdateAdminUserPayload = {
      email: editForm.email.trim(),
      fullName: editForm.fullName.trim(),
      isActive: editForm.isActive,
      isAdmin: editForm.isAdmin,
    };

    setPendingKey(`save-${editingUserId}`);
    setError(null);

    try {
      const updatedUser = await adminApi.updateUser(editingUserId, payload);
      replaceUserInList(updatedUser);
      handleCancelEdit();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Не удалось сохранить пользователя";
      setError(message);
    } finally {
      setPendingKey(null);
    }
  };

  const handleToggleAdmin = async (user: AdminUser): Promise<void> => {
    setPendingKey(`admin-${user.id}`);
    setError(null);

    try {
      const updatedUser = await adminApi.updateUser(user.id, { isAdmin: !user.isAdmin });
      replaceUserInList(updatedUser);
      if (editingUserId === user.id) {
        setEditForm(buildEditForm(updatedUser));
      }
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Не удалось обновить роль пользователя";
      setError(message);
    } finally {
      setPendingKey(null);
    }
  };

  const handleDelete = async (user: AdminUser): Promise<void> => {
    const confirmed = window.confirm(`Удалить пользователя ${user.fullName}? Это действие необратимо.`);

    if (!confirmed) {
      return;
    }

    setPendingKey(`delete-${user.id}`);
    setError(null);

    try {
      await adminApi.deleteUser(user.id);
      setUsers((state) => state.filter((item) => item.id !== user.id));

      if (editingUserId === user.id) {
        handleCancelEdit();
      }
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Не удалось удалить пользователя";
      setError(message);
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <section className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Пользователи
        </p>
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
        <p className="max-w-3xl text-muted-foreground">
          Здесь можно найти конкретного пользователя, изменить его данные, удалить аккаунт или выдать права администратора.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card/72">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-secondary p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего пользователей</p>
              <p className="text-2xl font-semibold">{users.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/72">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-success/15 p-3 text-success">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Активных</p>
              <p className="text-2xl font-semibold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/72">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-warning/15 p-3 text-warning">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Администраторов</p>
              <p className="text-2xl font-semibold">{adminCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/72">
        <CardHeader>
          <CardTitle>Поиск пользователей</CardTitle>
          <CardDescription>Ищите по id, email или имени пользователя.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={(event) => void handleSearchSubmit(event)}>
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Например: demo@student.ai или Demo Student"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Найти
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-warning">{error}</p> : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загружаем пользователей...</p>
      ) : users.length === 0 ? (
        <Card className="border-border/70 bg-card/72">
          <CardContent className="p-6 text-sm text-muted-foreground">
            По запросу {activeSearch ? `«${activeSearch}»` : "без фильтра"} пользователи не найдены.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const isEditing = editingUserId === user.id && editForm !== null;
            const isCurrentUser = currentUser?.id === user.id;

            return (
              <Card key={user.id} className="border-border/70 bg-card/72">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{user.fullName}</h2>
                        <Badge variant={user.isAdmin ? "warning" : "outline"}>
                          {user.isAdmin ? "администратор" : "пользователь"}
                        </Badge>
                        <Badge variant={user.isActive ? "success" : "outline"}>
                          {user.isActive ? "активен" : "деактивирован"}
                        </Badge>
                        {isCurrentUser ? <Badge variant="default">это вы</Badge> : null}
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{user.email}</p>
                        <p>id: {user.id}</p>
                        <p>Создан: {formatDate(user.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleStartEdit(user)} disabled={pendingKey !== null}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Редактировать
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => void handleToggleAdmin(user)}
                        disabled={pendingKey !== null || (isCurrentUser && user.isAdmin)}
                      >
                        {user.isAdmin ? (
                          <>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Снять админа
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Сделать админом
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        className="border-warning/30 text-warning hover:bg-warning/10"
                        onClick={() => void handleDelete(user)}
                        disabled={pendingKey !== null || isCurrentUser}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </Button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="grid gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`full-name-${user.id}`}>Имя</Label>
                        <Input
                          id={`full-name-${user.id}`}
                          value={editForm.fullName}
                          onChange={(event) => setEditForm((state) => (state ? { ...state, fullName: event.target.value } : state))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`email-${user.id}`}>Email</Label>
                        <Input
                          id={`email-${user.id}`}
                          type="email"
                          value={editForm.email}
                          onChange={(event) => setEditForm((state) => (state ? { ...state, email: event.target.value } : state))}
                        />
                      </div>

                      <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={editForm.isActive}
                          onChange={(event) =>
                            setEditForm((state) => (state ? { ...state, isActive: event.target.checked } : state))
                          }
                        />
                        Активный пользователь
                      </label>

                      <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={editForm.isAdmin}
                          onChange={(event) =>
                            setEditForm((state) => (state ? { ...state, isAdmin: event.target.checked } : state))
                          }
                          disabled={isCurrentUser && user.isAdmin}
                        />
                        Администратор
                      </label>

                      <div className="flex flex-wrap gap-2 md:col-span-2">
                        <Button onClick={() => void handleSaveEdit()} disabled={pendingKey !== null}>
                          <Save className="mr-2 h-4 w-4" />
                          Сохранить
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit} disabled={pendingKey !== null}>
                          <X className="mr-2 h-4 w-4" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
