/**
 * Learning goals.
 */

import type { AgentSessionHistory, Goal, GoalFormValues } from '@/types/goal'
import type { SpaceNode, SpaceNodeType, WorkspaceItemPosition } from '@/types/workspace'
import req from './request'

export const parseGoalByAI = (content: string) => {
  return req.post('/goals/parse', { messages: content })
}

/** Fetch the goal list. */
export const getGoals = async (): Promise<Goal[]> => {
  const { data } = await req.get<Goal[]>('/goals/list')
  return data || []
}

export const getGoal = (id: number) => {
  return req.get<Goal>(`/goals/${id}`)
}

export const deleteGoal = (id: number) => {
  return req.delete(`/goals/${id}`)
}

/** Create a goal. */
export const createGoal = (data: GoalFormValues) => {
  return req.post<Goal>('/goals/create', data)
}

export const getAgentSession = (goalId: number) => {
  return req.get<AgentSessionHistory>(`/goals/${goalId}/agent/session`)
}

export const getSpaceNodes = (goalId: number) => {
  return req.get<SpaceNode[]>(`/goals/${goalId}/nodes`)
}

export const createSpaceNode = (goalId: number, data: {
  type: SpaceNodeType
  title: string
  content?: Record<string, unknown>
  position?: WorkspaceItemPosition
}) => {
  return req.post<SpaceNode>(`/goals/${goalId}/nodes`, data)
}

export const updateSpaceNodePosition = (
  goalId: number,
  nodeId: number,
  position: WorkspaceItemPosition,
) => {
  return req.patch<SpaceNode>(`/goals/${goalId}/nodes/${nodeId}/position`, { position })
}

export const completeSpaceLesson = (
  goalId: number,
  nodeId: number,
  lessonId: string,
) => {
  return req.post<SpaceNode>(
    `/goals/${goalId}/nodes/${nodeId}/lessons/${encodeURIComponent(lessonId)}/complete`,
  )
}

/* Confirm the pending plan: persists GoalPlan/GoalPlanItem/LearningTask/SpaceNode. */
export interface ConfirmPlanResponse {
  message: string
  session_id: number
  plan_id: number
  stage: string
  version: number
  plan: Record<string, unknown>
}

export const confirmPlan = (id: number, sessionId: number) => {
  return req.post<ConfirmPlanResponse>(`/goals/${id}/agent/confirm`, {
    session_id: sessionId
  })
}

// /* delete: start the goal and generate a plan */
// export const startGoal = (id: number) => {
//   return req.post(`/goals/${id}/agent/start`)
// }

/** Generate a plan with streaming output. */
export const streamPlan = (id: number, session_id: number | null, message: string, signal?: AbortSignal) => {
  return req.post(`/goals/${id}/agent/messages/stream`, {
    session_id,
    message
  }, {
    signal
  })
}
