import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QuizBlockData } from '@/types/lesson'

interface QuizBlockProps {
  data: QuizBlockData
  completed?: boolean
  onCorrect: () => void
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect'

export default function QuizBlock({ data, completed = false, onCorrect }: QuizBlockProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>(
    completed ? 'correct' : 'unanswered',
  )

  const handleSelect = (option: string) => {
    setSelectedAnswer(option)
    if (option === data.answer) {
      setAnswerState('correct')
      onCorrect()
    } else {
      setAnswerState('incorrect')
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-medium leading-7">{data.question}</p>

      <div className="space-y-2">
        {data.options.map((option) => {
          const isSelected = selectedAnswer === option
          const isAnswer = option === data.answer
          const answeredCorrectly = answerState === 'correct'

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={answeredCorrectly}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                !isSelected && !answeredCorrectly && 'hover:bg-muted',
                isSelected && isAnswer && 'border-green-500 bg-green-500/10',
                isSelected && !isAnswer && 'border-destructive bg-destructive/10',
                !isSelected && isAnswer && answeredCorrectly && 'border-green-500/50',
              )}
            >
              <span>{option}</span>
              {isSelected && isAnswer && (
                <CheckCircle2 className="size-4 shrink-0 text-green-600" />
              )}
              {isSelected && !isAnswer && (
                <XCircle className="size-4 shrink-0 text-destructive" />
              )}
            </button>
          )
        })}
      </div>

      {answerState === 'incorrect' && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-destructive">回答不正确，再试一次。</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAnswer(null)
              setAnswerState('unanswered')
            }}
          >
            重新作答
          </Button>
        </div>
      )}

      {answerState === 'correct' && (
        <p className="text-sm font-medium text-green-600">回答正确，本块已完成。</p>
      )}
    </div>
  )
}
