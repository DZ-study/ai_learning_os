import { useEffect, useState } from "react"

export function useCountDown(defaultValue = 0) {
  const [countdown, setCountdown] = useState(defaultValue)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((count) => count - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const start = (seconds: number) => setCountdown(seconds)

  return { countdown, start }
}
