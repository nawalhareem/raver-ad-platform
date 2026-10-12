"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

/** Greg's clone. Must be the ElevenLabs id so Video TTS does not fall back to Adam. */
export const GREG_BOYD_VOICE_ID = "1zOq86TcL7aRGbVsejbL";
export const DEFAULT_VOICE_ID = GREG_BOYD_VOICE_ID;

export type VoiceOption = {
  id: string;
  voiceId: string;
  name: string;
  description: string;
  category: string;
  accent: string;
  preview_url?: string;
};

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: GREG_BOYD_VOICE_ID,
    voiceId: GREG_BOYD_VOICE_ID,
    name: "Greg Boyd",
    description: "Greg's voice",
    category: "Male",
    accent: "American",
  },
  {
    id: "emily",
    voiceId: "LcfcDJNUP1GQjkzn1xUU",
    name: "Emily",
    description: "Calm, professional American",
    category: "Female",
    accent: "American",
  },
  {
    id: "sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description: "Soft, professional American",
    category: "Female",
    accent: "American",
  },
];

export function resolveVoiceOption(voice?: string | null) {
  const key = (voice || DEFAULT_VOICE_ID).trim();
  const lower = key.toLowerCase();
  return (
    VOICE_OPTIONS.find(
      (v) =>
        v.id === key ||
        v.voiceId === key ||
        v.id.toLowerCase() === lower ||
        v.voiceId.toLowerCase() === lower ||
        v.name.toLowerCase() === lower
    ) || VOICE_OPTIONS[0]
  );
}


interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  className?: string;
  isDark?: boolean;
}

function previewErrorMessage(error: unknown, status?: number): string {
  const msg = error instanceof Error ? error.message : String(error || "");
  if (status === 401 || /unauthorized/i.test(msg)) {
    return "Sign in again to preview voices.";
  }
  if (
    !status ||
    status >= 500 ||
    /failed to fetch|network|load failed|econnrefused|not reachable/i.test(msg)
  ) {
    return "Can't play a sample right now. Try again in a moment.";
  }
  return "Couldn't play this voice sample.";
}

export function VoiceSelector({ selectedVoice, onSelect, className, isDark }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioRef] = useState(typeof Audio !== "undefined" ? new Audio() : null);
  const previewCache = React.useRef<Record<string, string>>({});

  const allVoices = VOICE_OPTIONS;

  React.useEffect(() => {
    if (audioRef) {
      audioRef.onended = () => {
        setPlayingId(null);
        setIsBuffering(false);
      };
      audioRef.onwaiting = () => setIsBuffering(true);
      audioRef.onplaying = () => setIsBuffering(false);
      audioRef.oncanplay = () => setIsBuffering(false);
      audioRef.onloadstart = () => setIsBuffering(true);
      audioRef.onerror = () => {
        setPlayingId(null);
        setIsBuffering(false);
      };
    }
    return () => {
      audioRef?.pause();
    };
  }, [audioRef]);

  // Handle outside clicks to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const togglePlay = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();
    if (!audioRef) return;

    if (playingId === voiceId) {
      audioRef.pause();
      setPlayingId(null);
      setIsBuffering(false);
    } else {
      const voice = allVoices.find(v => v.id === voiceId);
      if (voice) {
        try {
          setPlayingId(voiceId);
          setIsBuffering(true);

          const previewId = voice.voiceId || voice.id;
          let src = voice.preview_url || previewCache.current[previewId];

          if (!src) {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
            const tts = await apiFetch(`${API_BASE}/voice/generate-tts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: `Hi, I'm ${voice.name}. This is how I sound.`,
                voice_id: previewId,
              }),
            });
            if (!tts.ok) {
              throw Object.assign(
                new Error("Couldn't play this voice sample."),
                { status: tts.status }
              );
            }
            src = URL.createObjectURL(await tts.blob());
            previewCache.current[previewId] = src;
          }

          audioRef.src = src;

          const playPromise = audioRef.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.error("Audio play failed:", err);
              toast.error("Failed to play audio. The link might be expired or blocked.");
              setPlayingId(null);
              setIsBuffering(false);
            });
          }
        } catch (error: any) {
          console.error("Error fetching voice preview:", error);
          toast.error(previewErrorMessage(error, error?.status));
          setPlayingId(null);
          setIsBuffering(false);
        }
      }
    }
  };

  const currentVoice = resolveVoiceOption(selectedVoice);
  const isMale = currentVoice.category.startsWith("Male");

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-2", className)}>
      {!className?.includes("no-label") && (
        <label className={cn(
          "text-[10px] font-black uppercase tracking-widest ml-1 transition-colors",
          isDark ? "text-white/40" : "text-brand-primary"
        )}>
          Selection Voice
        </label>
      )}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-14 border rounded-[20px] px-6 flex items-center justify-between hover:scale-[1.01] transition-all active:scale-[0.98] shadow-sm overflow-hidden",
          isDark 
            ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20" 
            : "bg-white border-slate-100 text-brand-primary hover:border-slate-300"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
             {isMale ? <Icons.Mic className="w-4 h-4 text-blue-500" /> : <Icons.Mic className="w-4 h-4 text-pink-500" />}
          </div>
          <div className="flex flex-col items-start overflow-hidden">
             <span className={cn(
               "text-sm font-black truncate tracking-tight",
               isDark ? "text-white" : "text-brand-primary"
             )}>
               {currentVoice.name}
             </span>
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-normal truncate">{currentVoice.accent} • {currentVoice.category}</span>
          </div>
        </div>
        <Icons.ChevronDown className={cn("w-4 h-4 text-slate-300 transition-transform duration-500", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-[24px] shadow-2xl p-2 z-50 flex flex-col gap-1 max-h-[280px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 [scrollbar-width:thin] [scrollbar-color:#E2E8F0_transparent]">
            {allVoices.map((voice) => {
              const itemIsMale = voice.category.startsWith("Male");
              const isCurrentlyPlaying = playingId === voice.id;
              
              return (
                <div 
                  key={voice.id}
                  className={cn(
                    "w-full p-2 rounded-[18px] flex items-center gap-4 transition-all group relative",
                    selectedVoice === voice.id ? "bg-linear-to-r from-brand-primary to-brand-secondary" : "hover:bg-slate-50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => { onSelect(voice.id); setIsOpen(false); }}
                    className="flex-1 flex items-center gap-4 text-left"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border transition-all",
                      selectedVoice === voice.id ? "bg-white/10 border-white/20" : "bg-white border-slate-100"
                    )}>
                      {itemIsMale ? (
                        <Icons.Mic className={cn("w-5 h-5", selectedVoice === voice.id ? "text-white" : "text-blue-500")} />
                      ) : (
                        <Icons.Mic className={cn("w-5 h-5", selectedVoice === voice.id ? "text-white" : "text-pink-500")} />
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                       <span className={cn("text-xs font-black tracking-tight", selectedVoice === voice.id ? "text-white" : "text-brand-primary")}>{voice.name}</span>
                       <span className={cn("text-[8px] font-bold uppercase tracking-normal opacity-60 leading-none mb-1", selectedVoice === voice.id ? "text-white" : "text-slate-400")}>
                         {voice.accent} • {voice.category}
                       </span>
                       <span className={cn("text-[10px] truncate max-w-[150px]", selectedVoice === voice.id ? "text-white/70" : "text-slate-500")}>
                          {voice.description}
                       </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      onClick={(e) => togglePlay(e, voice.id)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95",
                        isCurrentlyPlaying 
                          ? "bg-white text-brand-primary" 
                          : selectedVoice === voice.id 
                            ? "bg-white/10 text-white hover:bg-white/20" 
                            : "bg-white border border-slate-100 text-brand-primary hover:bg-slate-100"
                      )}
                      title="Preview Voice"
                    >
                      {isCurrentlyPlaying ? (
                        isBuffering ? (
                          <Icons.Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icons.Pause className="w-3.5 h-3.5" />
                        )
                      ) : (
                        <Icons.Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>
                    {selectedVoice === voice.id && <Icons.Success className="w-4 h-4 text-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>
      )}
    </div>
  );
}
