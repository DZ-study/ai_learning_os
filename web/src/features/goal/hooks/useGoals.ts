import { useState } from "react";
import type { LearningGoal } from "../types";

export function useGoals() {
  const [goals] = useState<LearningGoal[]>([]);
  const [loading] = useState(false);
  return { goals, loading };
}
