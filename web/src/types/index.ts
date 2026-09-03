export type AgentStage =
  | "idle"
  | "analyzing"
  | "collecting_info"
  | "awaiting_plan_confirmation";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export type AgentPlan = Record<string, unknown>;