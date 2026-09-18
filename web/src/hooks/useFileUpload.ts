import { useRef, useState } from 'react'
import i18next from '@/i18n'

interface UseFileUploadOptions {
  accept?: string
  maxSize?: number
  maxFiles?: number
}

export default function useFileUpload({
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md',
  maxSize = 20 * 1024 * 1024,
  maxFiles = 10,
}: UseFileUploadOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])

  const openFilePicker = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (!selectedFiles.length) return

    const validFiles = selectedFiles.filter((file) => {
      if (file.size > maxSize) {
        console.error(i18next.t("error.file_too_large", { name: file.name }))
        return false
      }

      return true
    })

    setFiles((prev) => {
      const merged = [...prev, ...validFiles]

      // De-duplicate by file name.
      const uniqueFiles = merged.filter(
        (file, index, self) =>
          index ===
          self.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ),
      )

      return uniqueFiles.slice(0, maxFiles)
    })

    // Allow selecting the same file again.
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeAllFiles = () => {
    setFiles([])

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return {
    files,
    inputRef,
    accept,
    openFilePicker,
    handleFileChange,
    removeFile,
    removeAllFiles,
  }
}
