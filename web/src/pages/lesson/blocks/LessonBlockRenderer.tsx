import type {
  CodeBlockData,
  LessonBlock,
  QuizBlockData,
  TextBlockData,
} from '@/types/lesson'

import CodeBlock from './CodeBlock'
import QuizBlock from './QuizBlock'
import TextBlock from './TextBlock'

function markdownContent(content: LessonBlock['content']): string {
  const value = content as Record<string, unknown>
  return String(value.markdown ?? value.text ?? value.question ?? '')
}

interface LessonBlockRendererProps {
  block: LessonBlock
  completed?: boolean
  onComplete: () => void
}

export default function LessonBlockRenderer({
  block,
  completed = false,
  onComplete,
}: LessonBlockRendererProps) {
  switch (block.type) {
    case 'explanation':
    case 'question':
    case 'summary':
      return <TextBlock data={{ markdown: markdownContent(block.content) }} />
    case 'example': {
      const content = block.content as Record<string, unknown>
      if (typeof content.code === 'string') {
        return <CodeBlock data={content as unknown as CodeBlockData} />
      }
      return <TextBlock data={{ markdown: markdownContent(block.content) }} />
    }
    case 'code':
      return <CodeBlock data={block.content as CodeBlockData} />
    case 'quiz':
      return (
        <QuizBlock
          key={block.blockId}
          data={block.content as QuizBlockData}
          completed={completed}
          onCorrect={onComplete}
        />
      )
    default:
      return (
        <p className="text-sm text-muted-foreground">
          暂不支持的内容类型：{block.type}
        </p>
      )
  }
}
