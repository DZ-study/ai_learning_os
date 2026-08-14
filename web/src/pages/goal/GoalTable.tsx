import Empty from "@/components/Empty"
import Tag from "@/components/Tag"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface GoalTableItem {
  id: string
  /** 目标名称 */
  title: string
  /** 学习方向 */
  direction: string
  /** 当前阶段 */
  level: string
  levelColor: string
  /** 目标周期 */
  period: string
  /** 状态 */
  status: string
}

const goals: GoalTableItem[] = []

export default function GoalTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>目标名称</TableHead>
          <TableHead>学习方向</TableHead>
          <TableHead>当前阶段</TableHead>
          <TableHead>目标周期</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goals.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="p-0">
              <Empty />
            </TableCell>
          </TableRow>
        ) : (
          goals.map((goal) => (
            <TableRow key={goal.id}>
              <TableCell className="font-medium">{goal.title}</TableCell>
              <TableCell>{goal.direction}</TableCell>
              <TableCell>
                <Tag label={goal.level} color={goal.levelColor} />
              </TableCell>
              <TableCell>{goal.period}</TableCell>
              <TableCell>{goal.status}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline">详情</Button>
                <Button>AI生成学习计划</Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
