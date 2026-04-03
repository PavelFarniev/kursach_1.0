import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { notesApi } from "@/services/api/notesApi";
import type { CourseNote } from "@/types/domain";

interface CourseNotesState {
  notesByCourseId: Record<number, CourseNote[]>;
  pendingByCourseId: Record<number, string[]>;
  isLoading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  addNoteForCourse: (courseId: number, note: string) => Promise<void>;
  removeNoteForCourse: (courseId: number, noteId: number) => Promise<void>;
  clear: () => void;
}

interface LegacyCourseNotesState {
  notesByCourseId?: Record<number, CourseNote[] | string>;
  notesListByCourseId?: Record<number, string[] | string>;
  pendingByCourseId?: Record<number, string[]>;
}

const normalizeStringMap = (input: unknown): Record<number, string[]> => {
  if (!input || typeof input !== "object") {
    return {};
  }

  const result: Record<number, string[]> = {};

  Object.entries(input as Record<string, unknown>).forEach(([rawCourseId, rawNotes]) => {
    const courseId = Number(rawCourseId);

    if (!Number.isFinite(courseId)) {
      return;
    }

    if (Array.isArray(rawNotes)) {
      const notes = rawNotes.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (notes.length > 0) {
        result[courseId] = notes;
      }
      return;
    }

    if (typeof rawNotes === "string" && rawNotes.trim().length > 0) {
      result[courseId] = [rawNotes];
    }
  });

  return result;
};

const groupNotesByCourse = (notes: CourseNote[]): Record<number, CourseNote[]> =>
  notes.reduce<Record<number, CourseNote[]>>((accumulator, note) => {
    accumulator[note.courseId] = [...(accumulator[note.courseId] ?? []), note];
    return accumulator;
  }, {});

const buildNoteKey = (courseId: number, content: string): string => `${courseId}:${content.trim().toLowerCase()}`;

const mergeUniquePendingNotes = async (
  pendingByCourseId: Record<number, string[]>,
  remoteNotes: CourseNote[],
): Promise<CourseNote[]> => {
  const existingKeys = new Set(remoteNotes.map((note) => buildNoteKey(note.courseId, note.content)));
  const created: CourseNote[] = [];

  for (const [rawCourseId, pendingNotes] of Object.entries(pendingByCourseId)) {
    const courseId = Number(rawCourseId);

    for (const content of pendingNotes) {
      const trimmed = content.trim();
      const key = buildNoteKey(courseId, trimmed);

      if (!trimmed || existingKeys.has(key)) {
        continue;
      }

      const note = await notesApi.create({ courseId, content: trimmed });
      created.push(note);
      existingKeys.add(key);
    }
  }

  return created;
};

export const useCourseNotesStore = create<CourseNotesState>()(
  persist(
    (set, get) => ({
      notesByCourseId: {},
      pendingByCourseId: {},
      isLoading: false,
      error: null,

      bootstrap: async () => {
        set({ isLoading: true, error: null });

        try {
          const remoteNotes = await notesApi.my();
          const pendingByCourseId = get().pendingByCourseId;
          const created = await mergeUniquePendingNotes(pendingByCourseId, remoteNotes);
          const merged = [...remoteNotes, ...created].sort((left, right) => left.id - right.id);

          set({
            notesByCourseId: groupNotesByCourse(merged),
            pendingByCourseId: {},
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Не удалось загрузить заметки";
          set({ isLoading: false, error: message });
        }
      },

      addNoteForCourse: async (courseId, note) => {
        const trimmed = note.trim();
        if (!trimmed) {
          return;
        }

        set({ error: null });

      try {
        const created = await notesApi.create({ courseId, content: trimmed });
        set((state) => ({
          notesByCourseId: {
            ...state.notesByCourseId,
              [courseId]: [...(state.notesByCourseId[courseId] ?? []), created],
            },
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Не удалось сохранить заметку";
          set((state) => ({
            error: message,
            pendingByCourseId: {
              ...state.pendingByCourseId,
              [courseId]: [...(state.pendingByCourseId[courseId] ?? []), trimmed],
            },
          }));
          throw error;
        }
      },

      removeNoteForCourse: async (courseId, noteId) => {
        set({ error: null });

        try {
          await notesApi.remove(noteId);
          set((state) => ({
            notesByCourseId: {
              ...state.notesByCourseId,
              [courseId]: (state.notesByCourseId[courseId] ?? []).filter((note) => note.id !== noteId),
            },
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Не удалось удалить заметку";
          set({ error: message });
          throw error;
        }
      },

      clear: () => {
        set({ notesByCourseId: {}, pendingByCourseId: {}, isLoading: false, error: null });
      },
    }),
    {
      name: "course-notes-storage",
      version: 3,
      migrate: (persistedState, version) => {
        const state = (persistedState as LegacyCourseNotesState | undefined) ?? {};

        if (version < 3) {
          return {
            notesByCourseId: {},
            pendingByCourseId: {
              ...normalizeStringMap(state.notesByCourseId),
              ...normalizeStringMap(state.notesListByCourseId),
              ...normalizeStringMap(state.pendingByCourseId),
            },
            isLoading: false,
            error: null,
          } as CourseNotesState;
        }

        return {
          notesByCourseId: state.notesByCourseId ?? {},
          pendingByCourseId: normalizeStringMap(state.pendingByCourseId),
          isLoading: false,
          error: null,
        } as CourseNotesState;
      },
      partialize: (state) => ({
        notesByCourseId: state.notesByCourseId,
        pendingByCourseId: state.pendingByCourseId,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
