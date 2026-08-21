/**
 * 目标分析组件
 * 通过用户输入文本，解析为表单字段值
 */

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { parseGoalByAI } from '@/services/goal';
import { useMutation } from '@tanstack/react-query';
import { CirclePause, RefreshCw } from 'lucide-react';
import { useState } from 'react';


interface GoalAIAnalysisProps {
  onGenerated: (data: any) => void
}

export default function GoalAIAnalysis({
  onGenerated
}: GoalAIAnalysisProps) {
  const [input, setInput] = useState("")
  const [startFlag, setStartFlag] = useState(false)

  const {
    mutate,
    isPending,
    isError,
    error
  } = useMutation({
    mutationFn: parseGoalByAI,
    onSuccess: (data) => {
      console.log("AI解析学习目标", data);
      try {
        onGenerated(JSON.parse(data.data))
      } catch (error) {
        onGenerated({})
        console.error(error)
      }

    }
  })

  const handleParse = () => {
    if (!input.trim()) return
    setStartFlag(true)
    mutate(input)
  }

  return (<>
    <Textarea
      value={input}
      placeholder="例如：我想在三个月内从零基础学会React，可以独立开发一个网站..."
      onChange={(e) => setInput(e.target.value)}
      className="border-(--border) h-24"
    />
    {/** AI 分析异常 */}
    {isError && <div className="text-red-500">{error.message}</div>}
    {startFlag ? <div className="p-2 border border-(--primary)/20 rounded-(--radius) bg-(--primary-background) mt-2">
      <div className="flex items-center gap-2 text-(--color-primary) text-lg">
        {isPending ? <><Spinner data-icon="inline-start" /> <span>AI 学习助手正在分析中......</span></> : <span>AI 学习助手分析完成</span>}
      </div>
      <div className="mt-2 mb-6 text-sm">AI提取关键知识点，评估时间线并构建学习里程碑</div>
      <div className="flex gap-4 w-full mb-2">
        <Button className="flex-1 border-(--destructive) text-(--destructive)" variant="outline" disabled={!isPending}><CirclePause />停止分析</Button>
        <Button className="flex-1 border-(--primary) text-(--primary)" variant="outline" disabled={isPending} onClick={handleParse}><RefreshCw />重新分析</Button>
      </div>
    </div> : <Button className="w-full mt-2" onClick={handleParse}>开始AI分析</Button>}
  </>
  )
}
