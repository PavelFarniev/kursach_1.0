import { describe, expect, it } from "vitest";

import {
  FINAL_QUIZ_PENDING_PROGRESS,
  isFinalQuizSlide,
  progressToSlideIndex,
  slideIndexToProgress,
} from "@/pages/courses/courseProgress";
import type { CourseSlide } from "@/types/domain";

const slides: CourseSlide[] = [
  {
    id: "slide-1",
    title: "Тема 1",
    summary: "Коротко",
    theoryBlocks: ["Теория"],
    bullets: ["Пункт"],
    example: "Пример",
    practiceTask: "Обычный вопрос",
  },
  {
    id: "slide-2",
    title: "Тема 2",
    summary: "Коротко",
    theoryBlocks: ["Теория"],
    bullets: ["Пункт"],
    example: "Пример",
    practiceTask:
      'QUIZ::{"title":"Финальный тест","questions":[{"prompt":"1+1?","options":["1","2"],"correctIndex":1}]}',
  },
];

describe("courseProgress", () => {
  it("treats the last quiz slide as a final checkpoint before 100%", () => {
    expect(isFinalQuizSlide(slides, 1)).toBe(true);
    expect(slideIndexToProgress(1, slides, { finalQuizPassed: false })).toBe(FINAL_QUIZ_PENDING_PROGRESS);
    expect(slideIndexToProgress(1, slides, { finalQuizPassed: true })).toBe(100);
  });

  it("maps 99% progress to the final quiz slide", () => {
    expect(progressToSlideIndex(99, slides.length)).toBe(1);
  });
});
