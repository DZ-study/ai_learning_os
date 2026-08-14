/**
 * 学习目标
 */

import req from './request'

export const parseGoalByAI = (content: string) => {
  return req.post('/goals/parse', { messages: content })
}

/**获取目标列表 */
export const getGoals = () => {
  return req.get('/goals/list')
}