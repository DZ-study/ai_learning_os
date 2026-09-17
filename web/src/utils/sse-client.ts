import { createParser, type EventSourceMessage } from "eventsource-parser"
import { z } from "zod"

import { getAccessToken } from "@/utils/token"

const eventSchemas = {
  status: z.object({ stage: z.string().optional(), message: z.string() }),
  delta: z.object({ content: z.string() }),
  done: z.object({
    stage: z.string().optional(),
    session_id: z.number().optional(),
    question: z.string().optional(),
  }),
  plan_ready: z.object({
    stage: z.string(),
    session_id: z.number(),
    plan: z.record(z.string(), z.unknown()),
  }),
  error: z.object({
    code: z.union([z.string(), z.number()]).default("SSE_ERROR"),
    message: z.string(),
  }),
} as const

export type SSEEventType = keyof typeof eventSchemas
export type SSEEvent = {
  [K in SSEEventType]: { event: K; data: z.infer<(typeof eventSchemas)[K]> }
}[SSEEventType]

export class SSEClientError extends Error {
  readonly status?: number
  readonly code?: string | number

  constructor(message: string, options: { status?: number; code?: string | number } = {}) {
    super(message)
    this.name = "SSEClientError"
    this.status = options.status
    this.code = options.code
  }
}

export interface SSEProps {
  url: string;
  body: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export async function* streamSSE({
  url,
  body,
  headers,
  signal,
}: SSEProps): AsyncGenerator<SSEEvent> {
  const requestHeaders = new Headers(headers)
  requestHeaders.set("Content-Type", "application/json")
  const token = getAccessToken()
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`)

  const response = await fetch(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    let message = body || i18next.t("sse.request_failed", { status: response.status })
    try {
      const parsed: unknown = JSON.parse(body)
      if (typeof parsed === "object" && parsed !== null && "message" in parsed) {
        const serverMessage = (parsed as { message?: unknown }).message
        if (typeof serverMessage === "string") message = serverMessage
      }
    } catch {
      // Use the raw response body when it is not JSON.
    }
    throw new SSEClientError(message, { status: response.status })
  }

  if (!response.body) {
    throw new SSEClientError(i18next.t("sse.stream_unsupported"))
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const events: EventSourceMessage[] = [];

  const parser = createParser({
    onEvent(event) {
      events.push(event);
    },
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) parser.feed(decoder.decode(value, { stream: true }))

      while (events.length > 0) {
        const event = events.shift()!
        const eventType = event.event
        if (!eventType || !(eventType in eventSchemas)) {
          throw new SSEClientError(i18next.t("sse.event_unsupported", { event: eventType || i18next.t("sse.empty_event") }))
        }
        let data: unknown
        try {
          data = JSON.parse(event.data)
        } catch {
          throw new SSEClientError(i18next.t("sse.invalid_json", { event: eventType }))
        }
        const typedEvent = eventType as SSEEventType
        const result = eventSchemas[typedEvent].safeParse(data)
        if (!result.success) {
          throw new SSEClientError(i18next.t("sse.invalid_data", { event: typedEvent }))
        }
        yield { event: typedEvent, data: result.data } as SSEEvent
      }
      if (done) break
    }
    parser.feed(decoder.decode());
    while (events.length > 0) {
      const event = events.shift()!
      const eventType = event.event
      if (!eventType || !(eventType in eventSchemas)) {
        throw new SSEClientError(i18next.t("sse.event_unsupported", { event: eventType || i18next.t("sse.empty_event") }))
      }
      let data: unknown
      try {
        data = JSON.parse(event.data)
      } catch {
        throw new SSEClientError(i18next.t("sse.invalid_json", { event: eventType }))
      }
      const typedEvent = eventType as SSEEventType
      const result = eventSchemas[typedEvent].safeParse(data)
      if (!result.success) {
        throw new SSEClientError(i18next.t("sse.invalid_data", { event: typedEvent }))
      }
      yield { event: typedEvent, data: result.data } as SSEEvent
    }
  } finally {
    reader.releaseLock()
  }
}
import i18next from "@/i18n"
