import type { CodeBlockData } from '@/types/lesson'

interface CodeBlockProps {
  data: CodeBlockData
}

export default function CodeBlock({ data }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="text-xs text-zinc-400">{data.language}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-6">
        <code>{data.code}</code>
      </pre>
    </div>
  )
}
