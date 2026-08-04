export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  userId: string;
  knowledgeId: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface CreateQuizRequest {
  knowledgeId: string;
  title: string;
}

export interface SubmitAnswerRequest {
  answers: Record<string, string>;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string>;
  score: number;
  createdAt: string;
}
