import { useRef } from "react";

export type StreamMessage = { role: "user" | "assistant"; content: string };

const ts = () => new Date().toISOString().slice(11, 23); // HH:mm:ss.mmm

/**
 * Streams a chat response using XMLHttpRequest.
 *
 * React Native's fetch does not expose response.body as a ReadableStream,
 * making true streaming impossible via fetch. XHR's onprogress fires as
 * each chunk arrives, giving us the same progressive update behaviour.
 */
export function useStreamingChat(apiUrl: string) {
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function cancelStream() {
    xhrRef.current?.abort();
  }

  function sendMessage(
    history: StreamMessage[],
    onChunk: (accumulated: string, isDone: boolean) => void
  ): Promise<void> {
    xhrRef.current?.abort();

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      let lastLength = 0;
      let accumulated = "";

      xhr.open("POST", apiUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      // Fires progressively as chunks arrive
      xhr.onprogress = () => {
        const newData = xhr.responseText.slice(lastLength);
        lastLength = xhr.responseText.length;
        if (!newData) return;
        accumulated += newData;
        console.log(`[${ts()}][stream] chunk (${accumulated.length} chars total)`);
        onChunk(accumulated, false);
      };

      xhr.onload = () => {
        // Flush any remaining data not caught by onprogress
        const remaining = xhr.responseText.slice(lastLength);
        if (remaining) accumulated += remaining;
        console.log(`[${ts()}][stream] done — ${accumulated.length} chars, status ${xhr.status}`);
        if (xhr.status < 200 || xhr.status >= 300) {
          console.warn(`[${ts()}][stream] bad status:`, xhr.status, accumulated);
          onChunk(`Error ${xhr.status}: ${accumulated}`, true);
        } else {
          onChunk(accumulated, true);
        }
        resolve();
      };

      xhr.onerror = () => {
        console.error(`[${ts()}][stream] network error`);
        onChunk(accumulated || "Network error. Please try again.", true);
        resolve();
      };

      xhr.onabort = () => {
        console.log(`[${ts()}][stream] aborted`);
        resolve();
      };

      console.log(`[${ts()}][stream] → POST`, apiUrl);
      xhr.send(JSON.stringify({ messages: history }));
    });
  }

  return { sendMessage, cancelStream };
}
