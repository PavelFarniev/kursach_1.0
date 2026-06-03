import type { CourseSlide } from "@/types/domain";
import { parseModuleQuiz } from "@/widgets/course/moduleQuiz";

export const FINAL_QUIZ_PENDING_PROGRESS = 99;

export const progressToSlideIndex = (progressPercent: number, slidesCount: number): number => {
  if (slidesCount <= 0 || progressPercent <= 0) {
    return 0;
  }

  for (let slideIndex = 0; slideIndex < slidesCount; slideIndex += 1) {
    const slideProgress = Math.round(((slideIndex + 1) / slidesCount) * 100);

    if (progressPercent <= slideProgress) {
      return slideIndex;
    }
  }

  return slidesCount - 1;
};

export const isFinalQuizSlide = (slides: CourseSlide[], slideIndex: number): boolean => {
  if (slides.length === 0 || slideIndex !== slides.length - 1) {
    return false;
  }

  return parseModuleQuiz(slides[slideIndex]?.practiceTask ?? "") !== null;
};

export const slideIndexToProgress = (
  slideIndex: number,
  slides: CourseSlide[],
  options?: { finalQuizPassed?: boolean },
): number => {
  if (slides.length <= 0) {
    return 0;
  }

  const clampedIndex = Math.min(Math.max(0, slideIndex), slides.length - 1);

  if (isFinalQuizSlide(slides, clampedIndex) && !options?.finalQuizPassed) {
    return FINAL_QUIZ_PENDING_PROGRESS;
  }

  return Math.min(100, Math.max(0, Math.round(((clampedIndex + 1) / slides.length) * 100)));
};
