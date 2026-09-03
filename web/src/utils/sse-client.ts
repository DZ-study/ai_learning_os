import {
  createParser,
  type EventSourceMessage,
} from "eventsource-parser";

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
}: SSEProps): AsyncGenerator<EventSourceMessage> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`SSE 请求失败：${response.status}`);
  }

  if (!response.body) {
    throw new Error("浏览器不支持 ReadableStream");
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
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      parser.feed(
        decoder.decode(value, {
          stream: true,
        }),
      );

      while (events.length > 0) {
        yield events.shift()!;
      }
    }
    parser.feed(decoder.decode());
    while (events.length > 0) {
      yield events.shift()!;
    }
  } finally {
    reader.releaseLock();
  }
}