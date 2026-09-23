export const goalKeys = {
  all: ['goals'] as const,
  list: () => [...goalKeys.all, 'list'] as const,
  detail: (goalId: number) => [...goalKeys.all, 'detail', goalId] as const,
  progress: (goalId: number) => [...goalKeys.all, 'progress', goalId] as const,
}

export const spaceNodeKeys = {
  all: ['space-nodes'] as const,
  list: (goalId: number) => [...spaceNodeKeys.all, 'list', goalId] as const,
}

export const lessonKeys = {
  all: ['lessons'] as const,
  detail: (lessonId: number) => [...lessonKeys.all, 'detail', lessonId] as const,
  content: (lessonId: number) => [...lessonKeys.all, 'content', lessonId] as const,
}

export const progressKeys = {
  all: ['progress'] as const,
  lesson: (lessonId: number) => [...progressKeys.all, 'lesson', lessonId] as const,
  goal: (goalId: number) => [...progressKeys.all, 'goal', goalId] as const,
}

export const agentSessionKeys = {
  all: ['agent-sessions'] as const,
  active: (goalId: number) => [...agentSessionKeys.all, 'active', goalId] as const,
}
