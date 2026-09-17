import Header from '@/components/layout/Header';

import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useFileUpload from '@/hooks/useFileUpload';
import useGreeting from '@/hooks/useGreet';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AttachmentBox from './home/AttachmentBox';
import GoalList from './home/GoalList';

export default function ChatInterface() {

  const navigate = useNavigate()
  const { t } = useTranslation()

  const [inputValue, setInputValue] = useState('');
  const [greeting] = useGreeting("Janice Dong")
  const {
    files,
    inputRef,
    accept,
    openFilePicker,
    handleFileChange,
    removeFile,
  } = useFileUpload()

  const handleSend = () => {
    // 新建目标

    navigate("/space", {
      state: {
        type: 'add_goal',
        message: inputValue,
        attachments: files
      }
    })
    setInputValue('')
  }

  return (<div className="min-h-screen bg-[#fbfbfb]">
    <Header />
    <div className="flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl text-[#1a2b4b] mb-8 font-serif tracking-wide text-center">
          {greeting}
        </h1>
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap gap-2 items-start mb-4">
            {files.map((file, index) =>
              <AttachmentBox file={file} index={index} removeFile={removeFile} />
            )}
          </div>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("home.input_placeholder")}
            className="w-full min-h-[60px] text-base text-gray-600 border-0 focus-visible:ring-0 resize-none p-0 placeholder:text-gray-400 bg-transparent"
          />

          <div className="flex items-center justify-between mt-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border border-gray-200 p-0.5">
                <FileUpload
                  inputRef={inputRef}
                  accept={accept}
                  onOpen={openFilePicker}
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`h-8 w-8 rounded-full text-gray-400 ${inputValue.trim()
                ? 'text-gray-700 cursor-pointer'
                : 'text-gray-500 disabled:cursor-not-allowed'
                } hover:none`}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      <GoalList />
    </div>
  </div>
  )
}
