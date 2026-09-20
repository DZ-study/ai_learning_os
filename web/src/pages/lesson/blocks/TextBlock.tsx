import type { ReactNode } from 'react'

import type { TextBlockData } from '@/types/lesson'

function renderInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
}

function renderMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.split('\n')
  const nodes: ReactNode[] = []
  let key = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const buffer: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        buffer.push(lines[i])
        i += 1
      }
      i += 1
      nodes.push(
        <pre
          key={key++}
          className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm"
        >
          {buffer.join('\n')}
        </pre>,
      )
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      const className =
        level === 1
          ? 'text-xl font-semibold'
          : level === 2
            ? 'mt-2 text-lg font-semibold'
            : 'text-base font-semibold'
      nodes.push(
        <p key={key++} className={className}>
          {renderInline(heading[2])}
        </p>,
      )
      i += 1
      continue
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ''))
        i += 1
      }
      nodes.push(
        <ul key={key++} className="list-disc space-y-1 pl-6">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (line.trim() !== '') {
      nodes.push(
        <p key={key++} className="leading-7 text-foreground/90">
          {renderInline(line)}
        </p>,
      )
    }
    i += 1
  }

  return nodes
}

interface TextBlockProps {
  data: TextBlockData
}

export default function TextBlock({ data }: TextBlockProps) {
  return <div className="space-y-3">{renderMarkdown(data.markdown)}</div>
}
