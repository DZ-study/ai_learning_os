/**
 * 学习目标
 */

import type { Goal, GoalFormValues } from '@/types/goal'
import req from './request'

export const parseGoalByAI = (content: string) => {
  return req.post('/goals/parse', { messages: content })
}

/**获取目标列表 */
export const getGoals = async (): Promise<Goal[]> => {
  const { data } = await req.get<Goal[]>('/goals/list')
  return data || []
}

/**创建目标 */
export const createGoal = (data: GoalFormValues) => {
  return req.post('/goals/create', data)
}