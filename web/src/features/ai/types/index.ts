export interface AskTutorRequest {
  question: string;
  conversationId?: string | null;
}

export interface AskTutorResponse {
  conversationId: string;
  answer: string;
}

export interface GeneratePlanRequest {
  goalDescription: string;
}

export interface GeneratePlanResponse {
  steps: string[];
}

export interface QuizQuestion {
  question: string;
  answer: string;
}

export interface GenerateQuizRequest {
  knowledgeContent: string;
  count?: number;
}

export interface GenerateQuizResponse {
  questions: QuizQuestion[];
}
