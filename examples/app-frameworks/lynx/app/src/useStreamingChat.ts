import { useCallback, useEffect, useRef } from "@lynx-js/react";

import type { ApiChatMessage } from "./types.js";

type StreamReadResult = {
  done: boolean;
  value?: ArrayBuffer | Uint8Array;
};

type StreamReader = {
  cancel(reason?: unknown): Promise<unknown>;
  read(): Promise<StreamReadResult>;
};

export type StreamResult = {
  content: string;
  status: "cancelled" | "complete";
};

function createChunkDecoder() {
  const webDecoder = typeof TextDecoder === "function" ? new TextDecoder() : null;

  return {
    decode(value: ArrayBuffer | Uint8Array) {
      if (webDecoder) {
        const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
        return webDecoder.decode(bytes, { stream: true });
      }

      if (value instanceof ArrayBuffer) return TextCodecHelper.decode(value);

      const buffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
      return TextCodecHelper.decode(buffer as ArrayBuffer);
    },
    flush() {
      return webDecoder?.decode() ?? "";
    },
  };
}

async function readError(response: { status: number; text(): Promise<string> }) {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const body = await response.text();
    if (!body) return fallback;

    try {
      const parsed = JSON.parse(body) as { error?: unknown };
      return typeof parsed.error === "string" ? parsed.error : body;
    } catch {
      return body;
    }
  } catch {
    return fallback;
  }
}

export function useStreamingChat(apiUrl: string) {
  const activeReaderRef = useRef<StreamReader | null>(null);
  const requestVersionRef = useRef(0);

  const cancelStream = useCallback(() => {
    requestVersionRef.current += 1;
    const reader = activeReaderRef.current;
    activeReaderRef.current = null;
    if (reader) void reader.cancel("Stopped by the user").catch(() => undefined);
  }, []);

  useEffect(() => cancelStream, [cancelStream]);

  const sendMessage = useCallback(
    async (
      messages: ApiChatMessage[],
      onChunk: (accumulated: string) => void,
    ): Promise<StreamResult> => {
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;

      const previousReader = activeReaderRef.current;
      activeReaderRef.current = null;
      if (previousReader)
        void previousReader.cancel("Superseded by a new request").catch(() => undefined);

      const request = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      };
      const response = __IS_WEB__
        ? await fetch(apiUrl, request)
        : await lynx.fetch(apiUrl, {
            ...request,
            lynxExtension: { useStreaming: true },
          });

      if (!response.ok) throw new Error(await readError(response));

      const body = response.body as unknown as { getReader(): StreamReader | null } | null;
      const reader = body?.getReader();
      if (!reader) throw new Error("This Lynx host does not expose streaming response bodies.");

      activeReaderRef.current = reader;
      const decoder = createChunkDecoder();
      let accumulated = "";
      let animationFrame: number | null = null;

      const publish = (immediate = false) => {
        if (immediate) {
          if (animationFrame !== null) cancelAnimationFrame(animationFrame);
          animationFrame = null;
          onChunk(accumulated);
          return;
        }

        if (animationFrame !== null) return;
        animationFrame = requestAnimationFrame(() => {
          animationFrame = null;
          onChunk(accumulated);
        });
      };

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (requestVersion !== requestVersionRef.current) {
            publish(true);
            return { content: accumulated, status: "cancelled" };
          }

          if (done) break;
          if (!value) continue;

          accumulated += decoder.decode(value);
          publish();
        }

        accumulated += decoder.flush();
        publish(true);
        return { content: accumulated, status: "complete" };
      } catch (error) {
        if (requestVersion !== requestVersionRef.current) {
          publish(true);
          return { content: accumulated, status: "cancelled" };
        }

        throw error;
      } finally {
        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        if (activeReaderRef.current === reader) activeReaderRef.current = null;
      }
    },
    [apiUrl],
  );

  return { cancelStream, sendMessage };
}
