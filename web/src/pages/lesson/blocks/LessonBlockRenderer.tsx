import type {
  CodeBlockData,
  LessonBlock,
  QuizBlockData,
  TextBlockData,
} from '@/types/lesson'

import CodeBlock from './CodeBlock'
import QuizBlock from './QuizBlock'
import TextBlock from './TextBlock'

interface LessonBlockRendererProps {
  block: LessonBlock
  onComplete: () => void
}

export default function LessonBlockRenderer({
  block,
  onComplete,
}: LessonBlockRendererProps) {
  switch (block.type) {
    case 'text':
    case 'exercise':
      return <TextBlock data={block.data as TextBlockData} />
    case 'code':
      return <CodeBlock data={block.data as CodeBlockData} />
    case 'quiz':
      return <QuizBlock data={block.data as QuizBlockData} onCorrect={onComplete} />
    default:
      return (
        <p className="text-sm text-muted-foreground">
          暂不支持的内容类型：{block.type}
        </p>
      )
  }
}
