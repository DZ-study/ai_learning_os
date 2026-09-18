import Header from '@/components/layout/Header';

import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useFileUpload from '@/hooks/useFileUpload';
import useGreeting from '@/hooks/useGreet';
import { createGoal } from '@/services/goal';
import { useGoalStore } from '@/stores/goalStore';
import { ArrowUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AttachmentBox from './home/AttachmentBox';
import GoalList from './home/GoalList';

const getGreetingEmoji = (hour: number) => {
  if (hour >= 5 && hour < 12) return '☀️'
  if (hour >= 12 && hour < 18) return '🌤️'
  return '🌙'
}

export default function ChatInterface() {

  const navigate = useNavigate()
  const { t } = useTranslation()
  const setCurrentGoal = useGoalStore((state) => state.setCurrentGoal)

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

  const suggestions = t('home.suggestions', { returnObjects: true }) as string[]

  const handleSend = async () => {
    const title = inputValue.trim()
    if (!title) return

    const { data: goal } = await createGoal({
      title,
      description: `围绕“${title}”制定学习计划`,
      duration: 90,
      priority: 'medium',
    })
    setCurrentGoal(goal)

    navigate(`/space/${goal.id}`, {
      state: {
        type: 'add_goal',
        message: inputValue,
        attachments: files
      }
    })
    setInputValue('')
  }

  return (<div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f8f9fc] to-[#eef1f8]">
    <Header />
    <main className="flex flex-1 flex-col items-center px-6 pt-14 pb-12 font-sans">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="mb-3 text-center font-serif text-3xl font-semibold tracking-wide text-[#1a2b4b] md:text-4xl">
          <span className="mr-2">{getGreetingEmoji(new Date().getHours())}</span>
          {greeting}
        </h1>
        <p className="mb-6 text-sm text-gray-400">{t("home.guidance")}</p>
        <div className="w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_35px_rgba(80,72,180,0.10)] transition-shadow duration-300 focus-within:shadow-[0_14px_45px_rgba(80,72,180,0.16)] hover:shadow-[0_14px_45px_rgba(80,72,180,0.14)]">
          <div className="flex flex-wrap gap-2 items-start mb-4">
            {files.map((file, index) =>
              <AttachmentBox key={index} file={file} index={index} removeFile={removeFile} />
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
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label={t("common.send")}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.45)] transition-all duration-200 hover:from-indigo-600 hover:to-violet-600 hover:shadow-[0_6px_22px_rgba(99,102,241,0.55)] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            {t("home.inspiration")}
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInputValue(suggestion)}
                className="cursor-pointer rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-sm text-gray-500 shadow-[0_1px_4px_rgba(80,72,180,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-600 hover:shadow-[0_6px_16px_rgba(99,102,241,0.15)]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
      <GoalList />
    </main>
    <footer className="pb-6 text-center text-xs text-gray-400">
      {t("home.footer")}
    </footer>
  </div>
  )
}
