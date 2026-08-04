import api from "@/shared/utils/api";
import type { Quiz, CreateQuizRequest, SubmitAnswerRequest, QuizAttempt } from "../types";

export const quizService = {
  createQuiz: (data: CreateQuizRequest) => api.post<Quiz>("/quiz/", data),
  submitAnswer: (quizId: string, data: SubmitAnswerRequest) =>
    api.post<QuizAttempt>(`/quiz/${quizId}/submit`, data),
};
