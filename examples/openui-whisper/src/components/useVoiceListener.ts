"use client";

import { useEffect, useRef, useState } from "react";

export type ListenerState = "off" | "listening" | "capturing" | "transcribing";

type Options = {
  /** Master switch. When false, the mic is released entirely. */
  enabled: boolean;
  /** When true, audio is still metered but no new utterance is captured (e.g. while the model streams). */
  paused: boolean;
  /** Called with the transcript once a complete utterance is detected and transcribed. */
  onTranscript: (text: string) => void;
  /** Silence (ms) after speech that marks the end of an utterance. */
  silenceMs?: number;
};

async function transcribe(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audio, "speech.webm");

  const response = await fetch("/api/transcribe", { method: "POST", body: formData });
  const data = await response.json();

  if (!response.ok) throw new Error(data.error ?? "Transcription failed");
  return data.text as string;
}

// RMS thresholds on a normalized 0..1 scale. Onset is higher than release so a
// brief dip mid-word doesn't prematurely end the utterance (hysteresis).
const ONSET_RMS = 0.04;
const RELEASE_RMS = 0.025;
// Blobs shorter than this are treated as noise, not speech.
const MIN_UTTERANCE_BYTES = 1600;

/**
 * Always-on microphone listener with client-side voice activity detection.
 *
 * Continuously meters input level (exposed via `levelRef` for cheap, render-free
 * animation) and segments speech into utterances: capture starts when the level
 * crosses `ONSET_RMS` and ends after `silenceMs` of quiet, at which point the
 * captured audio is transcribed and handed to `onTranscript`.
 */
export function useVoiceListener({ enabled, paused, onTranscript, silenceMs = 1100 }: Options) {
  const [state, setState] = useState<ListenerState>("off");
  const [error, setError] = useState<string | null>(null);
  const levelRef = useRef(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  const lastVoiceRef = useRef(0);

  // Latest values mirrored into refs so the long-lived rAF loop and async
  // callbacks never read stale closures. Synced in an effect (not during render).
  const pausedRef = useRef(paused);
  const enabledRef = useRef(enabled);
  const onTranscriptRef = useRef(onTranscript);
  const silenceRef = useRef(silenceMs);
  useEffect(() => {
    pausedRef.current = paused;
    enabledRef.current = enabled;
    onTranscriptRef.current = onTranscript;
    silenceRef.current = silenceMs;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const buffer = new Uint8Array(1024);

    const startUtterance = () => {
      const stream = streamRef.current;
      if (!stream || recorderRef.current) return;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        recorderRef.current = null;
        const idle = () => setState(enabledRef.current ? "listening" : "off");

        if (blob.size < MIN_UTTERANCE_BYTES) {
          idle();
          return;
        }
        setState("transcribing");
        try {
          const text = (await transcribe(blob)).trim();
          if (text) onTranscriptRef.current(text);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          idle();
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setState("capturing");
    };

    const endUtterance = () => {
      recorderRef.current?.stop();
    };

    const analyserRef = { current: null as AnalyserNode | null };

    const tick = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      analyser.getByteTimeDomainData(buffer);

      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i++) {
        const sample = (buffer[i] - 128) / 128;
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);
      levelRef.current = Math.min(1, rms * 5);

      const now = performance.now();
      if (!pausedRef.current) {
        if (rms > ONSET_RMS) {
          lastVoiceRef.current = now;
          if (!speakingRef.current) {
            speakingRef.current = true;
            startUtterance();
          }
        } else if (
          speakingRef.current &&
          rms < RELEASE_RMS &&
          now - lastVoiceRef.current > silenceRef.current
        ) {
          speakingRef.current = false;
          endUtterance();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;

        setError(null);
        setState("listening");
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setError("Microphone access denied");
        setState("off");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      recorderRef.current?.stop();
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      speakingRef.current = false;
      levelRef.current = 0;
      setState("off");
    };
  }, [enabled]);

  return { state, error, levelRef };
}
