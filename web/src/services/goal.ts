/**
 * Learning goals.
 */

import type { Goal, GoalFormValues } from '@/types/goal'
import req from './request'

export const parseGoalByAI = (content: string) => {
  return req.post('/goals/parse', { messages: content })
}

/** Fetch the goal list. */
export const getGoals = async (): Promise<Goal[]> => {
  const { data } = await req.get<Goal[]>('/goals/list')
  return data || []
}

/** Create a goal. */
export const createGoal = (data: GoalFormValues) => {
  return req.post('/goals/create', data)
}

/* Generate a plan. */
export const generatePlan = (id: number, sessionId: number): Promise<void> => {
  return req.post(`/goals/${id}/agent/confirm`, {
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
