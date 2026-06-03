import { Bot, SendHorizonal, Sparkles, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authApi } from "@/services/api/authApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { cn } from "@/shared/lib/utils";
import { useChatStore } from "@/store/chatStore";
import { AIMessageContent } from "@/widgets/chat/AIMessageContent";

interface AIChatWidgetProps {
  courseId: number;
  courseTitle: string;
  compact?: boolean;
}

interface StarterPrompt {
  label: string;
  requiresTopic?: boolean;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  { label: "Проверь мой текущий уровень", requiresTopic: true },
  { label: "Собери мини-тренировку на 10 минут", requiresTopic: true },
  { label: "Сделай короткую шпаргалку", requiresTopic: true },
  { label: "Разбери типичные ошибки и как их избежать", requiresTopic: true },
];

export function AIChatWidget({
  courseId,
  courseTitle,
  compact = false,
}: AIChatWidgetProps): JSX.Element {
  const [text, setText] = useState("");
  const [credentials, setCredentials] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isCredentialsExpanded, setIsCredentialsExpanded] = useState(false);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(true);
  const [isCredentialsSaving, setIsCredentialsSaving] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const loadHistory = useChatStore((state) => state.loadHistory);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const messagesByCourse = useChatStore((state) => state.messagesByCourse);
  const isSendingByCourse = useChatStore((state) => state.isSendingByCourse);
  const isLoadingByCourse = useChatStore(
    (state) => state.isLoadingHistoryByCourse,
  );
  const errorByCourse = useChatStore((state) => state.errorByCourse);

  const messages = messagesByCourse[courseId] ?? [];
  const isSending = isSendingByCourse[courseId] ?? false;
  const isLoading = isLoadingByCourse[courseId] ?? false;
  const error = errorByCourse[courseId] ?? null;
  const credentialsInputId = `gigachat-credentials-${courseId}`;
  const chatInputId = `ai-chat-message-${courseId}`;

  useEffect(() => {
    void loadHistory(courseId);
  }, [courseId, loadHistory]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const status = await authApi.getGigachatCredentialsStatus();
        if (isMounted) {
          setHasCredentials(status.hasCredentials);
          setIsCredentialsExpanded(!status.hasCredentials);
          setCredentialsError(null);
        }
      } catch (error) {
        if (isMounted) {
          setCredentialsError(
            getApiErrorMessage(error, "Не удалось проверить ключ GigaChat"),
          );
        }
      } finally {
        if (isMounted) {
          setIsCredentialsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const placeholder = useMemo(
    () => `Спросите AI-ассистента по теме курса «${courseTitle}»`,
    [courseTitle],
  );

  const handleSaveCredentials = async (): Promise<void> => {
    const value = credentials.trim();

    if (value.length < 20) {
      setCredentialsError("Введите корректный GigaChat Authorization Key");
      return;
    }

    setIsCredentialsSaving(true);
    setCredentialsError(null);

    try {
      const status = await authApi.updateGigachatCredentials({
        credentials: value,
      });
      setHasCredentials(status.hasCredentials);
      setIsCredentialsExpanded(false);
      setCredentials("");
    } catch (error) {
      setCredentialsError(
        getApiErrorMessage(error, "Не удалось сохранить ключ GigaChat"),
      );
    } finally {
      setIsCredentialsSaving(false);
    }
  };

  const handleDeleteCredentials = async (): Promise<void> => {
    setIsCredentialsSaving(true);
    setCredentialsError(null);

    try {
      const status = await authApi.deleteGigachatCredentials();
      setHasCredentials(status.hasCredentials);
      setIsCredentialsExpanded(true);
      setCredentials("");
    } catch (error) {
      setCredentialsError(
        getApiErrorMessage(error, "Не удалось удалить ключ GigaChat"),
      );
    } finally {
      setIsCredentialsSaving(false);
    }
  };

  const handleSend = async (): Promise<void> => {
    const content = text.trim();
    if (!content || !hasCredentials) {
      return;
    }

    setText("");
    await sendMessage(courseId, content);
  };

  const content = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-card/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Личный ключ GigaChat
            </p>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Статус:{" "}
              {isCredentialsLoading
                ? "проверяем..."
                : hasCredentials
                  ? "ключ сохранён"
                  : "ключ не задан"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsCredentialsExpanded((current) => !current)
              }
              disabled={isCredentialsLoading || isCredentialsSaving}
            >
              {isCredentialsExpanded
                ? "Скрыть"
                : hasCredentials
                  ? "Управление ключом"
                  : "Добавить ключ"}
            </Button>
            {hasCredentials && isCredentialsExpanded && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleDeleteCredentials()}
                disabled={isCredentialsSaving || isCredentialsLoading}
              >
                Удалить
              </Button>
            )}
          </div>
        </div>

        {isCredentialsExpanded && (
          <div className="mt-3 space-y-3">
            <p className="text-xs leading-5 text-muted-foreground">
              Каждый аккаунт использует свой Authorization Key. Ключ шифруется
              на backend и не показывается повторно. Префикс <code>Basic</code>{" "}
              указывать не нужно.
            </p>

            <div className="space-y-2">
              <Label htmlFor={credentialsInputId}>
                GigaChat Authorization Key
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={credentialsInputId}
                  type="password"
                  value={credentials}
                  onChange={(event) => setCredentials(event.target.value)}
                  placeholder={
                    hasCredentials
                      ? "Ключ уже сохранён. Введите новый для замены"
                      : "Введите GIGACHAT_CREDENTIALS"
                  }
                  disabled={isCredentialsSaving || isCredentialsLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSaveCredentials()}
                  disabled={
                    isCredentialsSaving ||
                    isCredentialsLoading ||
                    credentials.trim().length === 0
                  }
                >
                  {hasCredentials ? "Заменить" : "Сохранить"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {credentialsError && (
          <p className="mt-2 text-xs text-warning" role="alert">
            {credentialsError}
          </p>
        )}
      </div>

      {!isLoading && messages.length === 0 && (
        <div
          className={cn(
            "rounded-2xl border p-4",
            compact
              ? "border-border/70 bg-muted/20 dark:bg-card/92"
              : "border-primary/25 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 shadow-sm dark:from-[rgba(35,55,82,0.95)] dark:via-[rgba(29,48,73,0.96)] dark:to-[rgba(25,42,66,0.94)]",
          )}
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Быстрый старт с ассистентом
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Выберите готовый сценарий и ассистент сразу начнет с нужного формата
            ответа.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() =>
                  setText(
                    prompt.requiresTopic
                      ? `${prompt.label}. Тема: `
                      : prompt.label,
                  )
                }
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-sm text-foreground transition",
                  compact
                    ? "border-border/70 bg-background hover:bg-muted dark:bg-card/90 dark:hover:bg-muted/90"
                    : "border-primary/20 bg-white/85 hover:bg-primary/10 dark:bg-card/90 dark:hover:bg-primary/14",
                )}
              >
                <span>{prompt.label}</span>
                {prompt.requiresTopic && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    тема: ...
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={cn(
          "h-[220px] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/30 p-3 dark:bg-card/82",
          compact ? "h-[180px]" : "sm:h-[260px]",
        )}
      >
        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Загружаем историю диалога...
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-2 rounded-lg p-3",
              message.role === "assistant"
                ? "bg-secondary/65 dark:bg-secondary/90"
                : "bg-background dark:bg-card/90",
            )}
          >
            {message.role === "assistant" ? (
              <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <UserCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs uppercase text-muted-foreground">
                {message.role === "assistant" ? "AI assistant" : "Вы"}
              </p>
              {message.role === "assistant" ? (
                <AIMessageContent content={message.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {message.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <p className="text-sm text-muted-foreground">
            Ассистент формирует ответ...
          </p>
        )}
        {error && <p className="text-sm text-warning" role="alert">{error}</p>}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={chatInputId}>Сообщение ассистенту</Label>
          <Textarea
            id={chatInputId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholder}
            disabled={isSending || !hasCredentials}
            className={
              compact
                ? "min-h-[72px] resize-none bg-background/70 dark:bg-card/90"
                : "min-h-[88px] resize-none"
            }
          />
        </div>
        <Button
          onClick={() => void handleSend()}
          className="w-full"
          size={compact ? "sm" : "default"}
          disabled={isSending || !hasCredentials || text.trim().length === 0}
        >
          <SendHorizonal className="mr-2 h-4 w-4" />
          {isSending ? "Отправка..." : "Отправить в AI-чат"}
        </Button>
      </div>
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card className="border-border/70 bg-card/72">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          AI-ассистент
        </CardTitle>
      </CardHeader>

      <CardContent>{content}</CardContent>
    </Card>
  );
}
