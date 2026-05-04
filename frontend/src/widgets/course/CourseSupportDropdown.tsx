import { Bot, ChevronDown, ChevronUp, NotebookPen, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useCourseNotesStore } from "@/store/courseNotesStore";
import { AIChatWidget } from "@/widgets/chat/AIChatWidget";
import { CourseNotesWidget } from "@/widgets/course/CourseNotesWidget";

interface CourseSupportDropdownProps {
  courseId: number;
  courseTitle: string;
}

type SupportPanel = "ai" | "notes" | null;

export function CourseSupportDropdown({ courseId, courseTitle }: CourseSupportDropdownProps): JSX.Element {
  const [activePanel, setActivePanel] = useState<SupportPanel>(null);
  const notesCount = useCourseNotesStore((state) => state.notesByCourseId[courseId]?.length ?? 0);

  const panelTitle = useMemo(() => {
    if (activePanel === "ai") {
      return "AI-разбор по теме";
    }

    if (activePanel === "notes") {
      return "Рабочие заметки";
    }

    return "Помощь по курсу";
  }, [activePanel]);

  const togglePanel = (panel: Exclude<SupportPanel, null>): void => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-5 right-4 z-30 hidden xl:block",
          activePanel ? "w-[332px] 2xl:w-[352px]" : "w-[308px] 2xl:w-[328px]",
        )}
      >
        <div className="overflow-hidden rounded-[22px] border border-border/80 bg-card/92 shadow-[0_18px_40px_rgba(15,23,42,0.10)] backdrop-blur dark:border-border dark:bg-card/96 dark:shadow-[0_24px_56px_rgba(2,8,24,0.46)]">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{panelTitle}</p>
              {activePanel ? <p className="text-xs text-muted-foreground">Открывайте по необходимости.</p> : null}
            </div>

            {activePanel ? (
              <Button size="icon" variant="ghost" onClick={() => setActivePanel(null)} aria-label="Свернуть блок помощи">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="flex gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => togglePanel("ai")}
              className={cn(
                "inline-flex flex-1 items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                activePanel === "ai"
                  ? "border-primary/35 bg-primary/10 text-foreground dark:bg-primary/14"
                  : "border-border/70 bg-background/70 text-muted-foreground hover:bg-muted dark:bg-card/90 dark:hover:bg-muted/90",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI
              </span>
              {activePanel === "ai" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => togglePanel("notes")}
              className={cn(
                "inline-flex flex-1 items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                activePanel === "notes"
                  ? "border-primary/35 bg-primary/10 text-foreground dark:bg-primary/14"
                  : "border-border/70 bg-background/70 text-muted-foreground hover:bg-muted dark:bg-card/90 dark:hover:bg-muted/90",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-primary" />
                Заметки
              </span>
              <span className="inline-flex items-center gap-2">
                {notesCount > 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{notesCount}</span> : null}
                {activePanel === "notes" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </span>
            </button>
          </div>

          {activePanel ? (
            <div className="max-h-[55vh] overflow-y-auto border-t border-border/60 px-4 py-4">
              {activePanel === "ai" ? (
                <AIChatWidget courseId={courseId} courseTitle={courseTitle} compact />
              ) : (
                <CourseNotesWidget courseId={courseId} compact />
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="rounded-2xl border border-border/70 bg-card/75 p-4 dark:bg-card/92">
          <p className="text-sm font-semibold text-foreground">Помощь по курсу</p>
          <p className="mt-1 text-sm text-muted-foreground">AI и заметки доступны в раскрывающемся блоке, чтобы не перегружать экран.</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-card/75 p-4 dark:bg-card/92">
          <button
            type="button"
            onClick={() => togglePanel("ai")}
            className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-left dark:bg-card/90"
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <Bot className="h-4 w-4 text-primary" />
              AI-разбор по теме
            </span>
            {activePanel === "ai" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
          </button>

          {activePanel === "ai" ? <AIChatWidget courseId={courseId} courseTitle={courseTitle} compact /> : null}

          <button
            type="button"
            onClick={() => togglePanel("notes")}
            className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-left dark:bg-card/90"
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <NotebookPen className="h-4 w-4 text-primary" />
              Рабочие заметки
            </span>
            <span className="inline-flex items-center gap-2">
              {notesCount > 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{notesCount}</span> : null}
              {activePanel === "notes" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
            </span>
          </button>

          {activePanel === "notes" ? <CourseNotesWidget courseId={courseId} compact /> : null}
        </div>
      </div>
    </>
  );
}
