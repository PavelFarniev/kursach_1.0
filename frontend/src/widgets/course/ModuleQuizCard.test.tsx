import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModuleQuizCard } from "@/widgets/course/ModuleQuizCard";
import type { ModuleQuiz } from "@/widgets/course/moduleQuiz";

const quiz: ModuleQuiz = {
  title: "Итоговый тест",
  description: "Проверьте знания",
  questions: [
    {
      prompt: "Сколько будет 2 + 2?",
      options: ["3", "4"],
      correctIndex: 1,
      explanation: "Правильный ответ: 4.",
    },
    {
      prompt: "Сколько дней в неделе?",
      options: ["7", "8"],
      correctIndex: 0,
      explanation: "В неделе 7 дней.",
    },
  ],
};

describe("ModuleQuizCard", () => {
  it("reports a failed final quiz attempt and allows retry", () => {
    const onSubmit = vi.fn();

    render(<ModuleQuizCard quiz={quiz} onSubmit={onSubmit} passingScore={70} />);

    fireEvent.click(screen.getByRole("button", { name: "А. 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Б. 8" }));
    fireEvent.click(screen.getByRole("button", { name: "Проверить ответы" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        passed: false,
        scorePercent: 0,
      }),
    );
    expect(screen.getByText(/Пока не зачтено/i)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Пройти ещё раз" }));
    fireEvent.click(screen.getByRole("button", { name: "Б. 4" }));
    fireEvent.click(screen.getByRole("button", { name: "А. 7" }));
    fireEvent.click(screen.getByRole("button", { name: "Проверить ответы" }));

    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        passed: true,
        scorePercent: 100,
      }),
    );
    expect(screen.getByText(/Тест пройден/i)).toBeVisible();
  });
});
