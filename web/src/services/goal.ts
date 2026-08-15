/**
 * 学习目标
 */

import type { GoalFormValues } from '@/types/goal'
import req from './request'

export const parseGoalByAI = (content: string) => {
  return req.post('/goals/parse', { messages: content })
}

/**获取目标列表 */
export const getGoals = () => {
  return req.get('/goals/list')
}

/**创建目标 */
export const createGoal = (data: GoalFormValues) => {
  return req.post('/goals/create', data)
}