import type { KnowledgeItem } from "../types";

interface KnowledgeCardProps {
  item: KnowledgeItem;
}

export default function KnowledgeCard({ item }: KnowledgeCardProps) {
  return <div className="border p-4 rounded-lg">{item.title} (stub)</div>;
}
