export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "abandoned"
  | "expired";

export interface LearningGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  currentLevel: string;
  targetDate: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  currentLevel?: string;
  targetDate?: string | null;
}

export interface UpdateGoalDTO {
  title?: string | null;
  description?: string | null;
  currentLevel?: string | null;
  targetDate?: string | null;
  status?: string | null;
}
