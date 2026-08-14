interface AIProcessProps {
  content: string
  loading: boolean
}

export function AIProcess({ content, loading }: AIProcessProps) {
  return (
    <div className="rounded-lg border p-4">
      {loading && (
        <div className="mb-3 text-sm text-muted-foreground">AI 正在分析...</div>
      )}
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  )
}
