import api from "@/shared/utils/api";
import type {
  AskTutorRequest,
  AskTutorResponse,
  GeneratePlanRequest,
  GeneratePlanResponse,
  GenerateQuizRequest,
  GenerateQuizResponse,
} from "../types";

export const aiService = {
  askTutor: (data: AskTutorRequest) => api.post<AskTutorResponse>("/ai/chat", data),
  generatePlan: (data: GeneratePlanRequest) => api.post<GeneratePlanResponse>("/ai/plan", data),
  generateQuiz: (data: GenerateQuizRequest) => api.post<GenerateQuizResponse>("/ai/quiz", data),
};
