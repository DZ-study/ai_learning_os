import { Button } from '@/components/ui/button'
import { Paperclip } from 'lucide-react'
import type { RefObject } from 'react'

interface FileUploadProps {
  file?: File | null
  inputRef: RefObject<HTMLInputElement | null>
  accept: string
  onOpen: () => void
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemove?: () => void
}

export default function FileUpload({
  // file,
  inputRef,
  accept,
  onOpen,
  onChange,
  // onRemove,
}: FileUploadProps) {
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onOpen}
        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
    </>
  )
}