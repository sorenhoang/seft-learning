"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type PlayState = "idle" | "playing" | "paused";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

const SKIP_SECONDS = 5;
// Rough English-TTS estimate at rate=1.0 (~160 wpm × ~6 chars/word ÷ 60).
// Scaled by playback speed when seeking. Seeks land on word boundaries after
// the next onboundary event, so perfect accuracy isn't required.
const CHARS_PER_SECOND = 16;

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  vi: "vi-VN",
};

function cleanMarkdown(text: string): string {
  return text
    // Remove fenced code blocks (including language tag)
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`[^`\n]*`/g, "")
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, "")
    // Convert links to their label text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove heading markers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold and italic
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_\n]+)_{1,3}/g, "$1")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove blockquote markers
    .replace(/^>\s*/gm, "")
    // Remove unordered list markers
    .replace(/^[-*+]\s+/gm, "")
    // Remove ordered list markers
    .replace(/^\d+\.\s+/gm, "")
    // Remove HTML tags
    .replace(/<[^>]+>/g, "")
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface AudioPlayerProps {
  content: string;
  lang?: string;
}

export default function AudioPlayer({ content, lang = "en" }: AudioPlayerProps) {
  const [state, setState] = useState<PlayState>("idle");
  const [speed, setSpeed] = useState<Speed>(1);
  const [progress, setProgress] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cleanedTextRef = useRef<string>("");
  const charIndexRef = useRef(0);

  // Pre-clean the content once
  useEffect(() => {
    cleanedTextRef.current = cleanMarkdown(content);
  }, [content]);

  // Stop speech on unmount (page navigation)
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const buildUtterance = useCallback(
    (text: string, startChar = 0): SpeechSynthesisUtterance => {
      const u = new SpeechSynthesisUtterance(text.slice(startChar));
      u.lang = LANG_MAP[lang] ?? "en-US";
      u.rate = speed;

      const totalLen = text.length;

      u.onboundary = (e) => {
        const absoluteChar = startChar + e.charIndex;
        charIndexRef.current = absoluteChar;
        setProgress(Math.min(100, Math.round((absoluteChar / totalLen) * 100)));
      };

      u.onend = () => {
        setState("idle");
        setProgress(100);
        charIndexRef.current = 0;
      };

      u.onerror = () => {
        setState("idle");
        setProgress(0);
        charIndexRef.current = 0;
      };

      return u;
    },
    [lang, speed]
  );

  // Detach the current utterance's handlers before cancelling so its
  // cancel-triggered onend can't race into the state we're about to set.
  const resetSpeech = useCallback(() => {
    const u = utteranceRef.current;
    if (u) {
      u.onend = null;
      u.onerror = null;
      u.onboundary = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  const handlePlay = useCallback(() => {
    const synth = window.speechSynthesis;
    const text = cleanedTextRef.current;
    if (!text) return;

    if (state === "paused") {
      synth.resume();
      setState("playing");
      return;
    }

    // New play from current charIndex (0 for fresh start)
    resetSpeech();
    const u = buildUtterance(text, charIndexRef.current);
    utteranceRef.current = u;
    synth.speak(u);
    setState("playing");
  }, [state, buildUtterance, resetSpeech]);

  const handlePause = useCallback(() => {
    window.speechSynthesis?.pause();
    setState("paused");
  }, []);

  const handleStop = useCallback(() => {
    resetSpeech();
    setState("idle");
    setProgress(0);
    charIndexRef.current = 0;
  }, [resetSpeech]);

  const handleSkip = useCallback(
    (deltaSec: number) => {
      const text = cleanedTextRef.current;
      if (!text) return;
      const totalLen = text.length;

      const charsDelta = Math.round(deltaSec * CHARS_PER_SECOND * speed);
      const newChar = Math.max(0, Math.min(totalLen, charIndexRef.current + charsDelta));
      charIndexRef.current = newChar;
      setProgress(Math.min(100, Math.round((newChar / totalLen) * 100)));

      const synth = window.speechSynthesis;

      if (state === "playing") {
        resetSpeech();
        if (newChar < totalLen) {
          const u = buildUtterance(text, newChar);
          utteranceRef.current = u;
          synth.speak(u);
        } else {
          setState("idle");
        }
      } else if (state === "paused") {
        resetSpeech();
        if (newChar < totalLen) {
          const u = buildUtterance(text, newChar);
          utteranceRef.current = u;
          synth.speak(u);
          synth.pause();
        } else {
          setState("idle");
          setProgress(0);
          charIndexRef.current = 0;
        }
      }
    },
    [state, speed, buildUtterance, resetSpeech]
  );

  const handleSpeedChange = useCallback(
    (newSpeed: Speed) => {
      setSpeed(newSpeed);
      // If currently playing, restart from last known position with new speed
      if (state === "playing") {
        const synth = window.speechSynthesis;
        const text = cleanedTextRef.current;
        resetSpeech();
        const u = new SpeechSynthesisUtterance(text.slice(charIndexRef.current));
        u.lang = LANG_MAP[lang] ?? "en-US";
        u.rate = newSpeed;
        const totalLen = text.length;
        const startChar = charIndexRef.current;
        u.onboundary = (e) => {
          const abs = startChar + e.charIndex;
          charIndexRef.current = abs;
          setProgress(Math.min(100, Math.round((abs / totalLen) * 100)));
        };
        u.onend = () => {
          setState("idle");
          setProgress(100);
          charIndexRef.current = 0;
        };
        u.onerror = () => {
          setState("idle");
          setProgress(0);
          charIndexRef.current = 0;
        };
        utteranceRef.current = u;
        synth.speak(u);
      }
    },
    [state, lang, resetSpeech]
  );

  const isPlaying = state === "playing";
  const isActive = state !== "idle";

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          aria-label={isPlaying ? "Pause" : state === "paused" ? "Resume" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPlaying ? (
            // Pause icon
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg className="h-4 w-4 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>

        {/* Skip controls — only visible when active */}
        {isActive && (
          <>
            <button
              onClick={() => handleSkip(-SKIP_SECONDS)}
              aria-label="Skip back 5 seconds"
              className="flex h-7 shrink-0 items-center gap-1 rounded-full border border-zinc-300 px-2.5 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
              <span className="text-[10px] font-semibold">5s</span>
            </button>
            <button
              onClick={() => handleSkip(SKIP_SECONDS)}
              aria-label="Skip forward 5 seconds"
              className="flex h-7 shrink-0 items-center gap-1 rounded-full border border-zinc-300 px-2.5 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <span className="text-[10px] font-semibold">5s</span>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </>
        )}

        {/* Stop button — only visible when active */}
        {isActive && (
          <button
            onClick={handleStop}
            aria-label="Stop"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        )}

        {/* Status label */}
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {state === "idle" && "Listen to this article"}
          {state === "playing" && "Playing…"}
          {state === "paused" && "Paused"}
        </span>

        {/* Speed selector */}
        <div className="ml-auto">
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(Number(e.target.value) as Speed)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
            aria-label="Playback speed"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
