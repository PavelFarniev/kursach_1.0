import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  buildModuleQuizResult,
  FINAL_QUIZ_PASS_PERCENT,
  type ModuleQuiz,
  type ModuleQuizResult,
} from "@/widgets/course/moduleQuiz";

interface ModuleQuizCardProps {
  quiz: ModuleQuiz;
  passingScore?: number;
  statusHint?: string;
  onSubmit?: (result: ModuleQuizResult) => void;
}

export function ModuleQuizCard({
  quiz,
  passingScore = FINAL_QUIZ_PASS_PERCENT,
  statusHint,
  onSubmit,
}: ModuleQuizCardProps): JSX.Element {
  const [answers, setAnswers] = useState<Array<number | null>>(() => quiz.questions.map(() => null));
  const [result, setResult] = useState<ModuleQuizResult | null>(null);

  const allAnswered = answers.every((answer) => answer !== null);
  const isSubmitted = result !== null;
  const previewResult = useMemo(() => buildModuleQuizResult(quiz, answers, passingScore), [answers, passingScore, quiz]);

  const handleSelect = (questionIndex: number, optionIndex: number): void => {
    if (isSubmitted) {
      return;
    }

    setAnswers((current) => current.map((answer, index) => (index === questionIndex ? optionIndex : answer)));
  };

  const handleSubmit = (): void => {
    const nextResult = buildModuleQuizResult(quiz, answers, passingScore);
    setResult(nextResult);
    onSubmit?.(nextResult);
  };

  const handleReset = (): void => {
    setAnswers(quiz.questions.map(() => null));
    setResult(null);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-primary/25 bg-primary/8 px-6 py-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">{quiz.title}</p>
        {quiz.description ? <p className="text-sm leading-6 text-muted-foreground">{quiz.description}</p> : null}
        <p className="text-sm text-muted-foreground">
          Для зачёта нужно набрать не менее {passingScore}% правильных ответов.
        </p>
      </div>

      <div className="space-y-5">
        {quiz.questions.map((question, questionIndex) => {
          const selectedAnswer = answers[questionIndex];
          const isCorrect = selectedAnswer === question.correctIndex;

          return (
            <div
              key={`${question.prompt}-${questionIndex}`}
              className="space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4"
            >
              <p className="text-base font-medium leading-7 text-foreground">
                {questionIndex + 1}. {question.prompt}
              </p>

              <div className="grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const showCorrect = isSubmitted && optionIndex === question.correctIndex;
                  const showIncorrect = isSubmitted && isSelected && optionIndex !== question.correctIndex;

                  return (
                    <button
                      key={`${option}-${optionIndex}`}
                      type="button"
                      onClick={() => handleSelect(questionIndex, optionIndex)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm leading-6 transition",
                        isSelected && !isSubmitted && "border-primary bg-primary/10 text-foreground",
                        !isSelected &&
                          !isSubmitted &&
                          "border-border/70 bg-background hover:border-primary/40 hover:bg-primary/6",
                        showCorrect && "border-emerald-500 bg-emerald-500/10 text-foreground",
                        showIncorrect && "border-rose-500 bg-rose-500/10 text-foreground",
                        isSubmitted &&
                          !showCorrect &&
                          !showIncorrect &&
                          "border-border/60 bg-background/70 text-muted-foreground",
                      )}
                    >
                      <span className="font-medium">{String.fromCharCode(1040 + optionIndex)}.</span> {option}
                    </button>
                  );
                })}
              </div>

              {isSubmitted ? (
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-6",
                    isCorrect
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                  )}
                >
                  <p className="font-semibold">{isCorrect ? "Ответ верный" : "Ответ неверный"}</p>
                  {question.explanation ? <p className="mt-1">{question.explanation}</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isSubmitted && result ? (
          <p className={cn("text-sm font-medium", result.passed ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
            {result.passed
              ? `Тест пройден: ${result.correctCount} из ${result.totalQuestions} (${result.scorePercent}%).`
              : `Пока не зачтено: ${result.correctCount} из ${result.totalQuestions} (${result.scorePercent}%). Нужно ${passingScore}% или выше.`}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {statusHint ?? `Ответьте на все вопросы, чтобы завершить модуль. Сейчас у вас ${previewResult.scorePercent}% по выбранным вариантам.`}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {isSubmitted ? (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Пройти ещё раз
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!allAnswered}>
              Проверить ответы
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
