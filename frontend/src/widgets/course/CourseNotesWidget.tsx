import { BookText, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCourseNotesStore } from "@/store/courseNotesStore";
import type { CourseNote } from "@/types/domain";

interface CourseNotesWidgetProps {
  courseId: number;
  compact?: boolean;
}

const EMPTY_NOTES: CourseNote[] = [];

export function CourseNotesWidget({ courseId, compact = false }: CourseNotesWidgetProps): JSX.Element {
  const [draft, setDraft] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const savedNotes = useCourseNotesStore((state) => state.notesByCourseId[courseId] ?? EMPTY_NOTES);
  const addNoteForCourse = useCourseNotesStore((state) => state.addNoteForCourse);
  const removeNoteForCourse = useCourseNotesStore((state) => state.removeNoteForCourse);
  const notesError = useCourseNotesStore((state) => state.error);

  const handleSaveNote = async (): Promise<void> => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    setActionLoading(true);

    try {
      await addNoteForCourse(courseId, trimmed);
      setDraft("");
    } finally {
      setActionLoading(false);
    }
  };

  const content = (
    <div className="space-y-3">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Например: повторить параметры и спросить AI про типичные ошибки..."
        className={compact ? "min-h-[96px] bg-background/70" : "min-h-[110px] bg-background/66"}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Нажмите сохранить, чтобы добавить заметку в список</p>
        <Button
          size="sm"
          className="hover:bg-secondary/70 hover:text-secondary-foreground"
          onClick={() => void handleSaveNote()}
          disabled={actionLoading}
        >
          Сохранить заметку
        </Button>
      </div>

      {notesError ? <p className="text-sm text-warning">{notesError}</p> : null}

      {savedNotes.length > 0 ? (
        <div className="space-y-2 pt-1">
          {savedNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
            >
              <p className="flex items-start gap-2 text-sm text-foreground">
                <BookText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{note.content}</span>
              </p>
              <button
                type="button"
                aria-label="Удалить заметку"
                onClick={() => void removeNoteForCourse(courseId, note.id)}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Пока нет заметок. Добавьте первую, чтобы не потерять важные мысли.</p>
      )}
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card className="border-border/70 bg-card/72">
      <CardHeader>
        <CardTitle className="text-xl">Заметки по курсу</CardTitle>
        <CardDescription>Фиксируйте формулы, ошибки и важные вопросы. Заметки сохраняются для этого курса.</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
