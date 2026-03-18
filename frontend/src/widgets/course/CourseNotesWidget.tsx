import { BookText, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCourseNotesStore } from "@/store/courseNotesStore";

interface CourseNotesWidgetProps {
  courseId: number;
}

const EMPTY_NOTES: string[] = [];

export function CourseNotesWidget({ courseId }: CourseNotesWidgetProps): JSX.Element {
  const [draft, setDraft] = useState("");
  const savedNotes = useCourseNotesStore((state) => state.notesListByCourseId[courseId] ?? EMPTY_NOTES);
  const addNoteForCourse = useCourseNotesStore((state) => state.addNoteForCourse);
  const removeNoteForCourse = useCourseNotesStore((state) => state.removeNoteForCourse);

  const handleSaveNote = (): void => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    addNoteForCourse(courseId, trimmed);
    setDraft("");
  };

  return (
    <Card className="border-border/70 bg-card/72">
      <CardHeader>
        <CardTitle className="text-xl">Заметки по курсу</CardTitle>
        <CardDescription>Фиксируйте формулы, ошибки и важные вопросы. Заметки сохраняются для этого курса.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Например: повторить параметры и спросить AI про типичные ошибки..."
          className="min-h-[110px] bg-background/66"
        />

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Нажмите сохранить, чтобы добавить заметку в список</p>
          <Button size="sm" className="hover:bg-secondary/70 hover:text-secondary-foreground" onClick={handleSaveNote}>
            Сохранить заметку
          </Button>
        </div>

        {savedNotes.length > 0 ? (
          <div className="space-y-2 pt-1">
            {savedNotes.map((note, index) => (
              <div
                key={`${courseId}-${index}-${note}`}
                className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
              >
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <BookText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{note}</span>
                </p>
                <button
                  type="button"
                  aria-label="Удалить заметку"
                  onClick={() => removeNoteForCourse(courseId, index)}
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
      </CardContent>
    </Card>
  );
}
