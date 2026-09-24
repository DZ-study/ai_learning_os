import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { Minus, Plus, Settings2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface FloatingToolbarProps {
  onAddNote: () => void
}

export default function FloatingToolbar({ onAddNote }: FloatingToolbarProps) {
  const zoom = useWorkspaceStore((state) => state.zoom)
  const setZoom = useWorkspaceStore((state) => state.setZoom)
  const removeItem = useWorkspaceStore((state) => state.removeItem)
  const selectedItemId = useWorkspaceStore((state) => state.selectedItemId)
  const { t } = useTranslation()

  return (
    <div className="workspace-toolbar">
      {/* <Button variant="ghost" size="icon-sm" title={t("workspace.grid_view")} aria-label={t("workspace.grid_view")} className="text-[#79757b]"><Grid2X2 className="size-4" /></Button> */}
      <Button variant="ghost" size="icon-sm" onClick={() => setZoom(zoom - 5)} title={t("workspace.zoom_out")} aria-label={t("workspace.zoom_out")} className="text-[#79757b]"><Minus className="size-4" /></Button>
      <span className="min-w-[42px] text-center text-xs text-[#77747a]">{zoom}%</span>
      <Button variant="ghost" size="icon-sm" onClick={() => setZoom(zoom + 5)} title={t("workspace.zoom_in")} aria-label={t("workspace.zoom_in")} className="text-[#79757b]"><Plus className="size-4" /></Button>
      <span className="mx-1 h-5 w-px bg-[#e5e1de]" />
      <Button variant="ghost" size="icon-sm" onClick={onAddNote} title={t("workspace.add_note")} aria-label={t("workspace.add_note")} className="text-[#79757b]"><Plus className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" disabled={!selectedItemId} onClick={() => selectedItemId && removeItem(selectedItemId)} title={t("workspace.delete_selected")} aria-label={t("workspace.delete_selected")} className="text-[#a66367] hover:bg-[#fff0f0]"><Trash2 className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" title={t("workspace.settings")} aria-label={t("workspace.settings")} className="text-[#79757b]"><Settings2 className="size-4" /></Button>
    </div>
  )
}
