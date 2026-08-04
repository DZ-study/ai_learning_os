import api from "@/shared/utils/api";
import type { KnowledgeItem, CreateKnowledgeDTO } from "../types";

export const knowledgeService = {
  listItems: () => api.get<KnowledgeItem[]>("/knowledge/"),
  createItem: (data: CreateKnowledgeDTO) => api.post<KnowledgeItem>("/knowledge/", data),
  getItem: (id: string) => api.get<KnowledgeItem>(`/knowledge/${id}`),
};
