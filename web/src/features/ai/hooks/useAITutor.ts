import { useState } from "react";

export function useAITutor() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async (question: string) => {
    setLoading(true);
    // Stub: will call api when implemented
    setAnswer(`[Stub] Answer to: ${question}`);
    setLoading(false);
  };

  return { answer, loading, askQuestion };
}
