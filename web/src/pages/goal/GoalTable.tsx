import Empty from "@/components/Empty"
import Tag from '@/components/Tag'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { GoalTableProps } from '@/types/goal'
import { GOAL_PRIORITY, GOAL_STATUS } from '@/utils/constants'

export default function GoalTable({
  data,
  onStart,
  onGenerate
}: GoalTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>目标名称</TableHead>
          <TableHead>目标周期</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>优先级</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="p-0">
              <Empty />
            </TableCell>
          </TableRow>
        ) : (
          data.map((goal) => {
            const priority = GOAL_PRIORITY[goal.priority] || { text: "未知", color: "gray" }
            return (
              <TableRow key={goal.id}>
                <TableCell className="font-medium">{goal.title}</TableCell>
                <TableCell>{goal.duration} 天</TableCell>
                <TableCell>{GOAL_STATUS[goal.status]}</TableCell>
                <TableCell><Tag label={priority.text} color={priority.color} /></TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline">详情</Button>
                  {goal.plan && <Button variant="outline" onClick={() => onStart(goal.id)}>
                    开始学习
                  </Button>}
                  {goal.plan && goal.status === "draft" && <Button variant="outline">重新生成学习计划</Button>}
                  {goal.status === "draft" && !goal.plan && <Button onClick={() => onGenerate(goal.id)}>生成学习计划</Button>}
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
