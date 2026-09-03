import { useCallback, useState } from "react";

import type {
  AgentMessage,
  AgentPlan,
  AgentStage,
} from "@/types/index";
import { streamSSE } from "@/utils/sse-client";

interface UseAgentSessionReturn {
  messages: AgentMessage[];
  stage: AgentStage;
  plan: AgentPlan | null;
  loading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  reset: () => void;
}

export function useAgentSession(
  goalId: number,
): UseAgentSessionReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [stage, setStage] = useState<AgentStage>("idle");
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      const content = message.trim();

      if (!content || loading) {
        return;
      }

      setError(null);
      setLoading(true);

      // 用户消息立即显示
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content,
        },
      ]);

      try {
        const stream = streamSSE({
          url: `/api/goals/${goalId}/agent/messages/stream`,
          body: {
            message: content,
          },
        });

        for await (const event of stream) {
          const data = JSON.parse(event.data);

          switch (event.event) {
            case "status":
              setStage(data.stage);
              break;

            case "delta":
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: data.content,
                },
              ]);
              break;

            case "plan_ready":
              setStage(data.stage);
              setPlan(data.plan);
              break;

            case "done":
              setStage(data.stage);
              break;

            case "error":
              setError(data.message);
              break;

            default:
              console.warn(
                `未知 SSE event: ${event.event}`,
                data,
              );
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Agent session error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "发送失败，请稍后重试",
        );
      } finally {
        setLoading(false);
      }
    },
    [goalId, loading],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setStage("idle");
    setPlan(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    messages,
    stage,
    plan,
    loading,
    error,
    sendMessage,
    reset,
  };
}