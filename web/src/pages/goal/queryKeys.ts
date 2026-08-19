export const goalKeys = {
  all: ["goals"] as const,
  list: () => [...goalKeys.all, "list"] as const,
  detail: (id: number) => [...goalKeys.all, "detail", id] as const,
}