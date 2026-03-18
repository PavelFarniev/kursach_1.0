import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CourseNotesState {
  notesListByCourseId: Record<number, string[]>;
  addNoteForCourse: (courseId: number, note: string) => void;
  removeNoteForCourse: (courseId: number, noteIndex: number) => void;
}

interface LegacyCourseNotesState {
  notesByCourseId?: Record<number, string>;
  notesListByCourseId?: Record<number, string[] | string>;
}

const normalizeNotesMap = (input: unknown): Record<number, string[]> => {
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
      result[courseId] = notes;
      return;
    }

    if (typeof rawNotes === "string" && rawNotes.trim().length > 0) {
      result[courseId] = [rawNotes];
    }
  });

  return result;
};

export const useCourseNotesStore = create<CourseNotesState>()(
  persist(
    (set) => ({
      notesListByCourseId: {},
      addNoteForCourse: (courseId, note) =>
        set((state) => ({
          notesListByCourseId: {
            ...state.notesListByCourseId,
            [courseId]: [
              ...(Array.isArray(state.notesListByCourseId[courseId]) ? state.notesListByCourseId[courseId] : []),
              note,
            ],
          },
        })),
      removeNoteForCourse: (courseId, noteIndex) =>
        set((state) => {
          const current = Array.isArray(state.notesListByCourseId[courseId]) ? state.notesListByCourseId[courseId] : [];
          const updated = current.filter((_, index) => index !== noteIndex);
          return {
            notesListByCourseId: {
              ...state.notesListByCourseId,
              [courseId]: updated,
            },
          };
        }),
    }),
    {
      name: "course-notes-storage",
      version: 2,
      migrate: (persistedState, version) => {
        const state = (persistedState as LegacyCourseNotesState | undefined) ?? {};

        if (version < 2) {
          const legacyMap = normalizeNotesMap(state.notesByCourseId);
          const nextMap = normalizeNotesMap(state.notesListByCourseId);
          return {
            notesListByCourseId: {
              ...legacyMap,
              ...nextMap,
            },
          } as CourseNotesState;
        }

        return {
          notesListByCourseId: normalizeNotesMap(state.notesListByCourseId),
        } as CourseNotesState;
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
