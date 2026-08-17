import Empty from "@/components/Empty"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Goal } from '@/types/goal'
import { GOAL_STATUS } from '@/utils/constants'

interface GoalTableProps {
  data: Goal[]
}

export default function GoalTable({
  data
}: GoalTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>目标名称</TableHead>
          <TableHead>目标周期</TableHead>
          <TableHead>状态</TableHead>
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
          data.map((goal) => (
            <TableRow key={goal.id}>
              <TableCell className="font-medium">{goal.title}</TableCell>
              <TableCell>{goal.duration} 天</TableCell>
              <TableCell>{GOAL_STATUS[goal.status]}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline">详情</Button>
                {goal.status === "draft" && <Button>启动</Button>}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
