import { Bot, SendHorizonal, Sparkles, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { useChatStore } from "@/store/chatStore";

interface AIChatWidgetProps {
  courseId: number;
  courseTitle: string;
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

export function AIChatWidget({ courseId, courseTitle }: AIChatWidgetProps): JSX.Element {
  const [text, setText] = useState("");
  const loadHistory = useChatStore((state) => state.loadHistory);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const messagesByCourse = useChatStore((state) => state.messagesByCourse);
  const isSendingByCourse = useChatStore((state) => state.isSendingByCourse);
  const isLoadingByCourse = useChatStore((state) => state.isLoadingHistoryByCourse);
  const errorByCourse = useChatStore((state) => state.errorByCourse);

  const messages = messagesByCourse[courseId] ?? [];
  const isSending = isSendingByCourse[courseId] ?? false;
  const isLoading = isLoadingByCourse[courseId] ?? false;
  const error = errorByCourse[courseId] ?? null;

  useEffect(() => {
    void loadHistory(courseId);
  }, [courseId, loadHistory]);

  const placeholder = useMemo(
    () => `Спросите AI-ассистента по теме курса «${courseTitle}»`,
    [courseTitle],
  );

  const handleSend = async (): Promise<void> => {
    const content = text.trim();
    if (!content) {
      return;
    }

    setText("");
    await sendMessage(courseId, content);
  };

  return (
    <Card className="border-border/70 bg-card/72">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          AI-ассистент
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isLoading && messages.length === 0 && (
          <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 p-4 shadow-sm">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Быстрый старт с ассистентом
            </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Выберите готовый сценарий и ассистент сразу начнет с нужного формата ответа.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => setText(prompt.requiresTopic ? `${prompt.label}. Тема: ` : prompt.label)}
                    className="rounded-xl border border-primary/20 bg-white/85 px-3 py-1.5 text-sm text-foreground transition hover:bg-primary/10"
                  >
                    <span>{prompt.label}</span>
                    {prompt.requiresTopic && <span className="ml-1 text-xs text-muted-foreground">тема: ...</span>}
                  </button>
                ))}
              </div>
            </div>
        )}

        <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/30 p-3">
          {isLoading && <p className="text-sm text-muted-foreground">Загружаем историю диалога...</p>}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-2 rounded-lg p-3",
                message.role === "assistant" ? "bg-secondary/65" : "bg-background",
              )}
            >
              {message.role === "assistant" ? (
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <UserCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              )}
              <div>
                <p className="mb-1 text-xs uppercase text-muted-foreground">
                  {message.role === "assistant" ? "AI assistant" : "Вы"}
                </p>
                <p className="text-sm leading-relaxed text-foreground">{message.content}</p>
              </div>
            </div>
          ))}

          {isSending && <p className="text-sm text-muted-foreground">Ассистент формирует ответ...</p>}
          {error && <p className="text-sm text-warning">{error}</p>}
        </div>

        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholder}
            disabled={isSending}
          />
          <Button onClick={() => void handleSend()} className="w-full" disabled={isSending || text.trim().length === 0}>
            <SendHorizonal className="mr-2 h-4 w-4" />
            {isSending ? "Отправка..." : "Отправить в AI-чат"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
