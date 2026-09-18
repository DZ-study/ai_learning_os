import { formatFileSize } from '@/utils'
import { X } from 'lucide-react'

interface AttachmentBoxProps {
  file: File
  index: number
  removeFile: (index: number) => void
}

const AttachmentBox = ({
  file,
  index,
  removeFile
}: AttachmentBoxProps) => {
  return (
    <div className="relative group">
      {/* File thumbnail placeholder */}
      <div className="w-[120px] h-[90px] bg-[#f0f4f8] rounded-xl border border-gray-200 flex flex-col items-center justify-center overflow-hidden">
        {/* Document preview lines */}
        <div className="w-full h-full p-2 flex flex-col gap-1.5 opacity-60">
          <div className="flex gap-1 items-center">
            <div className="w-2 h-2 rounded-full bg-green-300"></div>
            <div className="w-8 h-1.5 bg-gray-300 rounded"></div>
          </div>
          <div className="w-3/4 h-1.5 bg-gray-300 rounded ml-3"></div>
          <div className="w-1/2 h-1.5 bg-gray-300 rounded ml-3"></div>
          <div className="flex gap-1 items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-blue-300"></div>
            <div className="w-10 h-1.5 bg-gray-300 rounded"></div>
          </div>
          <div className="w-2/3 h-1.5 bg-gray-300 rounded ml-3"></div>
        </div>
        <div className="absolute top-2 left-2 truncate whitespace-nowrap overflow-hidden max-w-[100px] bg-white/90 backdrop-blur-sm border border-gray-200 text-[10px] text-gray-600 px-1.5 py-0.5 rounded">
          {file.name}
        </div>
        {/* File size label */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm border border-gray-200 text-[10px] text-gray-600 px-1.5 py-0.5 rounded">
          {formatFileSize(file.size)}
        </div>
      </div>

      {/* Delete button */}
      <button className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
        <X className="w-3 h-3 text-gray-500" onClick={() => removeFile(index)} />
      </button>
    </div>
  )
}

export default AttachmentBox