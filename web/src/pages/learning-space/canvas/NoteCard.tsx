import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Ellipsis, Pin, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { WorkspaceNote } from '@/types/workspace'

interface NoteCardProps {
  note: WorkspaceNote
  selected: boolean
  onSelect: () => void
  onChange: (content: string) => void
  onDelete: () => void
}

export default function NoteCard({ note, selected, onSelect, onChange, onDelete }: NoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <article className={cn('note-card', selected && 'note-card-selected')} onClick={onSelect}>
      <div className="flex items-center justify-between text-[#8c6a28]/70">
        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em]"><Pin className="size-3" /> {t(note.title, { defaultValue: note.title })}</div>
        <div className="relative">
          <Button variant="ghost" size="icon-xs" className="text-[#8c6a28]/60 hover:bg-black/5" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open) }} aria-label={t("workspace.note_actions")}>
            <Ellipsis className="size-3.5" />
          </Button>
          {menuOpen && <button
            className="absolute right-0 top-7 z-10 flex items-center gap-1.5 rounded-md border border-black/10 bg-[#fff8a8] px-1 py-1.5 text-[11px] text-red-700 shadow-lg"
            onClick={(event) => { event.stopPropagation(); onDelete() }}>
            <Trash2 className="size-3" /><span className="whitespace-nowrap">{t("common.delete")}</span>
          </button>}
        </div>
      </div>
      <textarea
        value={t(note.content, { defaultValue: note.content })}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => { event.stopPropagation(); onSelect() }}
        className="mt-4 min-h-[88px] w-full resize-none border-0 bg-transparent p-0 font-serif text-[18px] leading-7 text-[#514932] outline-none placeholder:text-[#9d8e55]"
        aria-label={t("workspace.edit_note")}
      />
      <div className="mt-2 text-right text-[10px] text-[#9e8d49]">{t("workspace.saved_note")}</div>
    </article>
  )
}
