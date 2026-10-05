"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn, parseCustomVoiceList } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

export const VOICE_OPTIONS = [
  // Male Voices
  { id: "adam", voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Deep, casual American male", category: "Male - Casual", accent: "American" },
  { id: "antoni", voiceId: "Bj9UqZbhQsanLzgalpEG", name: "Antoni", description: "Warm, friendly and professional, with a clear, even tone. Perfect for podcasts, corporate narration, and engaging content.", category: "Male - Professional", accent: "American" },
  { id: "arnold", voiceId: "nPczCjzI2devNBz1zQrb", name: "Arnold", description: "A warm, clear, and friendly voice with an American accent. Perfect for narration and storytelling.", category: "Male - Professional", accent: "American" },
  { id: "callum", voiceId: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Strong, middle-aged American", category: "Male - Professional", accent: "American" },
  { id: "charlie", voiceId: "IKne3meq5aSn9XLyUdCD", name: "Charlie - Confident & Energetic", description: "Deep, young Australian male", category: "Male - Casual", accent: "Australian", preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3" },
  { id: "clyde", voiceId: "2EiwWnXFnvU5JabPnv8n", name: "Clyde", description: "Middle-aged American narrator", category: "Male - Professional", accent: "American" },
  { id: "daniel", voiceId: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Deep, authoritative British", category: "Male - Professional", accent: "British" },
  { id: "drew", voiceId: "29vD33N1CtxCmqQRPOHJ", name: "Drew", description: "Young, energetic male", category: "Male - Casual", accent: "American" },
  { id: "ethan", voiceId: "g5CIjZEefAph4nQFvHAz", name: "Ethan", description: "American, conversational", category: "Male - Casual", accent: "American" },
  { id: "fin", voiceId: "D38z5RcWu1voky8WS1ja", name: "Fin", description: "Warm Irish narrator", category: "Male - Professional", accent: "Irish" },
  { id: "george", voiceId: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm British narrator", category: "Male - Professional", accent: "British" },
  { id: "harry", voiceId: "SOYHLrjzK2X1ezoPC6cr", name: "Harry", description: "Anxious, British young male", category: "Male - Character", accent: "British" },
  { id: "james", voiceId: "ZQe5CZNOzWyzPSCn5a3c", name: "James", description: "Professional, calm", category: "Male - Professional", accent: "British" },
  { id: "jeremy", voiceId: "bVMeCyTHy58xNoL34h3p", name: "Jeremy", description: "Animated, expressive Irish", category: "Male - Casual", accent: "Irish" },
  { id: "joseph", voiceId: "Zlb1dXrM653N07WRdFW3", name: "Joseph", description: "Professional British", category: "Male - Professional", accent: "British" },
  { id: "josh", voiceId: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", description: "Young American male", category: "Male - Casual", accent: "American" },
  { id: "liam", voiceId: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Neutral, professional American", category: "Male - Professional", accent: "American" },
  { id: "matilda", voiceId: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Warm American female", category: "Female - Professional", accent: "American" },
  { id: "michael", voiceId: "flq6f7yk4E4fJM5XTYuZ", name: "Michael", description: "Deep American male", category: "Male - Professional", accent: "American" },
  { id: "patrick", voiceId: "ODq5zmih8GrVes37Dizd", name: "Patrick", description: "Conversational American", category: "Male - Casual", accent: "American" },
  { id: "sam", voiceId: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", description: "Raspy American male", category: "Male - Casual", accent: "American" },
  { id: "thomas", voiceId: "GBv7mTt0atIp3Br8iCZE", name: "Thomas", description: "Young, energetic American", category: "Male - Casual", accent: "American" },

  // Female Voices
  { id: "alice", voiceId: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Confident British female", category: "Female - Professional", accent: "British" },
  { id: "charlotte", voiceId: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", description: "Clear British narrator", category: "Female - Professional", accent: "British" },
  { id: "domi", voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Strong, confident American", category: "Female - Professional", accent: "American" },
  { id: "dorothy", voiceId: "ThT5KcBeYPX3keUQqHPh", name: "Dorothy", description: "Warm, pleasant British", category: "Female - Professional", accent: "British" },
  { id: "elli", voiceId: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Emotional, young American", category: "Female - Casual", accent: "American" },
  { id: "emily", voiceId: "LcfcDJNUP1GQjkzn1xUU", name: "Emily", description: "Calm, professional American", category: "Female - Professional", accent: "American" },
  { id: "freya", voiceId: "jsCqWAovK2LkecY7zXl4", name: "Freya", description: "Young, expressive American", category: "Female - Casual", accent: "American" },
  { id: "gigi", voiceId: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", description: "Upbeat, American female", category: "Female - Casual", accent: "American" },
  { id: "glinda", voiceId: "z9fAnlkpzviPz146aGWa", name: "Glinda", description: "Witch-like, characterful", category: "Female - Character", accent: "American" },
  { id: "grace", voiceId: "oWAxZDx7w5VEj9dCyTzz", name: "Grace", description: "Soft Southern American", category: "Female - Casual", accent: "American Southern" },
  { id: "jessica", voiceId: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Young American female", category: "Female - Casual", accent: "American" },
  { id: "lily", voiceId: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "British, conversational", category: "Female - Casual", accent: "British" },
  { id: "mimi", voiceId: "zrHiDhphv9ZnVXBqCLjz", name: "Mimi", description: "Childlike, energetic", category: "Female - Character", accent: "American" },
  { id: "nicole", voiceId: "piTKgcLEGmPE4e6mEKli", name: "Nicole", description: "Whisper, soft American", category: "Female - Character", accent: "American" },
  { id: "rachel", voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm American narrator", category: "Female - Professional", accent: "American" },
  { id: "sarah", voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft, professional American", category: "Female - Professional", accent: "American" },
];

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  className?: string;
  isDark?: boolean;
}

export function VoiceSelector({ selectedVoice, onSelect, className, isDark }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [customVoices, setCustomVoices] = useState<any[]>([]);
  const [audioRef] = useState(typeof Audio !== "undefined" ? new Audio() : null);

  const allVoices = [...VOICE_OPTIONS, ...customVoices];

  React.useEffect(() => {
    const fetchCustomVoices = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const response = await apiFetch(`${API_BASE}/custom-voice/list?t=${Date.now()}`);
        if (response.ok) {
          const result = await response.json();
          const list = parseCustomVoiceList(result);
          if (result.success && list.length > 0) {
            const mapped = list
              .filter((v: any) => v.category === "cloned" || v.category === "generated" || v.category === "professional" || !VOICE_OPTIONS.some(s => s.voiceId === v.voice_id || s.id === v.voice_id))
              .map((v: any) => ({
                id: v.voice_id,
                voiceId: v.voice_id,
                name: v.name,
                description: v.description || "Custom neural voice",
                category: v.category || "Custom Clone",
                accent: v.labels?.accent || "Custom",
                preview_url: v.preview_url
              }));
            setCustomVoices(mapped);
          }
        }
      } catch (error) {
        console.error("Failed to fetch custom voices:", error);
      }
    };

    fetchCustomVoices();
  }, []);

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
          
          // If we already have a preview URL (dynamic voices), use it directly
          if (voice.preview_url) {
            audioRef.src = voice.preview_url;
          } else {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
            const previewId = voice.voiceId || voice.id;
            let src: string | null = null;

            try {
              const response = await apiFetch(`${API_BASE}/voice/get-voice/${previewId}`);
              if (response.ok) {
                const result = await response.json();
                const voiceData = result.success ? (result.data?.voice || result.data) : null;
                if (voiceData?.preview_url) src = voiceData.preview_url;
              }
            } catch {
              // Fall through to TTS sample.
            }

            if (!src) {
              const tts = await apiFetch(`${API_BASE}/voice/generate-tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: `Hi, I'm ${voice.name}. This is how I sound.`,
                  voice_id: previewId,
                }),
              });
              if (!tts.ok) {
                throw new Error("This voice isn't available on our ElevenLabs account.");
              }
              src = URL.createObjectURL(await tts.blob());
            }

            audioRef.src = src;
          }

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
          toast.error(error.message || "Error loading voice preview.");
          setPlayingId(null);
          setIsBuffering(false);
        }
      }
    }
  };

  const currentVoice = allVoices.find(v => v.id === selectedVoice) || allVoices[0];
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
