import api from "@/shared/utils/api";
import type { LearningGoal, CreateGoalDTO, UpdateGoalDTO } from "../types";

export const goalService = {
  listGoals: () => api.get<LearningGoal[]>("/goals/"),
  createGoal: (data: CreateGoalDTO) => api.post<LearningGoal>("/goals/", data),
  getGoal: (id: string) => api.get<LearningGoal>(`/goals/${id}`),
  updateGoal: (id: string, data: UpdateGoalDTO) => api.put<LearningGoal>(`/goals/${id}`, data),
  abandonGoal: (id: string) => api.delete(`/goals/${id}`),
};
