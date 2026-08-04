import type { LearningGoal } from "../types";

interface GoalCardProps {
  goal: LearningGoal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  return <div className="border p-4 rounded-lg">{goal.title} (stub)</div>;
}
