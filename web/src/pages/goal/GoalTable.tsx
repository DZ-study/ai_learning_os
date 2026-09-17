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
import { useTranslation } from 'react-i18next'

export default function GoalTable({
  data,
  onStart,
  onGenerate
}: GoalTableProps) {
  const { t } = useTranslation()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("goal.table.name")}</TableHead>
          <TableHead>{t("goal.table.duration")}</TableHead>
          <TableHead>{t("goal.table.status")}</TableHead>
          <TableHead>{t("goal.table.priority")}</TableHead>
          <TableHead>{t("goal.table.actions")}</TableHead>
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
            const priority = GOAL_PRIORITY[goal.priority] || { text: "common.unknown", color: "gray" }
            return (
              <TableRow key={goal.id}>
                <TableCell className="font-medium">{goal.title}</TableCell>
                <TableCell>{goal.duration} {t("common.day")}</TableCell>
                <TableCell>{t(GOAL_STATUS[goal.status])}</TableCell>
                <TableCell><Tag label={t(priority.text)} color={priority.color} /></TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline">{t("common.details")}</Button>
                  {/* {goal.plan && <Button variant="outline" onClick={() => onStart(goal.id)}>
                    {t("common.start")}
                  </Button>} */}
                  {goal.plan && goal.status === "draft" && <Button variant="default">{t("goal.regenerate_plan")}</Button>}
                  {goal.status === "draft" && !goal.plan && <Button onClick={() => onGenerate(goal.id)}>{t("goal.generate_plan")}</Button>}
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
