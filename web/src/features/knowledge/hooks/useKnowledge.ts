import { useState } from "react";
import type { KnowledgeItem } from "../types";

export function useKnowledge() {
  const [items] = useState<KnowledgeItem[]>([]);
  const [loading] = useState(false);
  return { items, loading };
}
