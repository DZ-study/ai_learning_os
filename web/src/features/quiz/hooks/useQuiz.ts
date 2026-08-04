import { useState } from "react";
import type { QuizAttempt } from "../types";

export function useQuiz() {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(false);

  const submitAnswers = async (_quizId: string, answers: Record<string, string>) => {
    setLoading(true);
    // Stub: will call api when implemented
    setAttempt({
      id: "stub-id",
      quizId: _quizId,
      userId: "stub-user",
      answers,
      score: 0,
      createdAt: new Date().toISOString(),
    });
    setLoading(false);
  };

  return { attempt, loading, submitAnswers };
}
