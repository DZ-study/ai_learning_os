export interface KnowledgeItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  sourceType: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeDTO {
  title: string;
  content?: string;
  sourceType?: string;
  sourceUrl?: string;
}
