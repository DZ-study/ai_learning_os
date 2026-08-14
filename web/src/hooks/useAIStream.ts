/**
 * 发请求
 * 读取stream
 * 拿后台数据
 * 更新state
 */
import { useState } from "react"

const useAIStream = () => {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async (input: string) => {
    setContent("")
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: input,
        }),
      })
      if (!response.ok) {
        throw new Error("请求失败")
      }

      if (!response.body) {
        throw new Error("浏览器不支持流式响应")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        const chunk = decoder.decode(value, {
          stream: true,
        })
        setContent((prevContent) => prevContent + chunk)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "请求失败")
    } finally {
      setLoading(false)
    }
  }

  return {
    content,
    loading,
    error,
    start,
  }
}

export default useAIStream
