"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Icons } from "@/components/ui/icons";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";
import { toast } from "react-toastify";

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category: string;
  description: string;
  labels: Record<string, string>;
  created_at?: string;
}

export default function VoiceStudioPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioRef] = useState(typeof Audio !== "undefined" ? new Audio() : null);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await apiFetch(`${API_BASE}/custom-voice/list?t=${Date.now()}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          if (Array.isArray(result.data)) {
            setVoices(result.data);
          } else if (result.data && Array.isArray(result.data.voices)) {
            setVoices(result.data.voices);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch voices:", error);
      toast.error("Failed to synchronize voices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  useEffect(() => {
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

  const togglePlay = (voice: Voice) => {
    if (!audioRef) return;
    
    if (!voice.preview_url) {
      toast.info("This custom voice doesn't have a preview audio yet. Cloned voices may require generating a sample first.");
      return;
    }

    if (playingId === voice.voice_id) {
      audioRef.pause();
      setPlayingId(null);
      setIsBuffering(false);
    } else {
      try {
        audioRef.src = voice.preview_url;
        const playPromise = audioRef.play();
        
        if (playPromise !== undefined) {
          setIsBuffering(true);
          playPromise.catch(err => {
            console.error("Audio play failed:", err);
            toast.error("Failed to play preview. The audio URL might be expired or blocked.");
            setPlayingId(null);
            setIsBuffering(false);
          });
        }
        setPlayingId(voice.voice_id);
      } catch (err) {
        console.error("Playback error:", err);
        toast.error("Audio playback error");
        setPlayingId(null);
        setIsBuffering(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceName || selectedFiles.length === 0) {
      toast.error("Please provide a name and at least one audio sample");
      return;
    }

    setIsCreating(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      
      const formData = new FormData();
      formData.append("name", voiceName);
      formData.append("description", voiceDescription);
      
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const endpoint = `${API_BASE}/custom-voice/clone`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Accept": "application/json",
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Custom voice cloned successfully!");
        setShowCreateForm(false);
        setVoiceName("");
        setVoiceDescription("");
        setSelectedFiles([]);
        fetchVoices();
      } else {
        let errorMessage = `Failed to clone voice (Status: ${response.status})`;
        try {
          const err = await response.json();
          errorMessage = err.message || err.error || errorMessage;
        } catch (e) {}
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("[VOICE CLONE] Critical Exception:", error);
      toast.error(error.message || "Critical failure during voice synthesis");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm("Are you sure you want to delete this custom voice? This action cannot be undone.")) return;

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await apiFetch(`${API_BASE}/custom-voice/${voiceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Voice deleted successfully");
        fetchVoices();
      } else {
        toast.error("Failed to delete voice");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete voice");
    }
  };

  if (isLoading && voices.length === 0) {
    return <RaverLoadingState title="Accessing Custom Voices" description="Synchronizing your custom ElevenLabs voice profiles..." />;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 rounded-[10px] bg-white mx-auto">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-[32px] font-black text-brand-primary tracking-normal lowercase leading-tight sm:leading-none">Custom Voices</h1>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2 sm:mt-3">Advanced ElevenLabs Voice Cloning & Management</p>
          </div>
          
          <button 
            onClick={() => setShowCreateForm(true)}
            className="h-12 sm:h-14 px-6 sm:px-8 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-[16px] sm:rounded-[20px] font-black text-[10px] sm:text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-primary/10 border border-white/5"
          >
            <Icons.Plus className="w-4 h-4" />
            Clone New Voice
          </button>
        </div>

        {/* Stats / Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Total Custom Voices</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl sm:text-[32px] font-black text-brand-primary">{voices.length}</span>
              <Icons.Mic className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500/20" />
            </div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Generation Method</span>
            <div className="flex items-end justify-between">
              <span className="text-xs sm:text-sm font-black text-brand-primary uppercase tracking-normal">Instant Cloning</span>
              <Icons.Zap className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500/20" />
            </div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Provider Status</span>
            <div className="flex items-end justify-between">
              <span className="text-xs sm:text-sm font-black text-emerald-500 uppercase tracking-normal">ElevenLabs Active</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Voice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {voices.map((voice) => (
            <div 
              key={voice.voice_id} 
              className="bg-white rounded-[24px] sm:rounded-[28px] border border-slate-100 p-5 sm:p-6 flex flex-col gap-5 sm:gap-6 group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[18px] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-brand-primary group-hover:border-brand-primary transition-all duration-500">
                    <Icons.Mic className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary group-hover:text-white transition-all" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-black text-brand-primary tracking-tight text-sm sm:text-base">{voice.name}</h3>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-normal">{voice.category || "Custom Clone"}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => togglePlay(voice)}
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm",
                    playingId === voice.voice_id 
                      ? "bg-brand-primary text-white" 
                      : !voice.preview_url 
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100" 
                        : "bg-white border border-slate-100 text-brand-primary hover:bg-slate-50"
                  )}
                  title={voice.preview_url ? "Play Preview" : "No preview available"}
                >
                  {playingId === voice.voice_id ? (
                    isBuffering ? (
                      <Icons.Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icons.Pause className="w-4 h-4" />
                    )
                  ) : (
                    <Icons.Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[12px] sm:text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                  {voice.description || "Custom voice profile generated through ElevenLabs neural synthesis."}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(voice.labels || {}).map(([key, value]) => (
                    <span key={key} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-normal">
                      {key}: {value}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md text-[8px] sm:text-[9px] font-bold text-blue-500 uppercase tracking-normal">
                    {voice.voice_id.substring(0, 8)}...
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  {voice.created_at ? new Date(voice.created_at).toLocaleDateString() : "Active Session"}
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(voice.voice_id);
                      toast.success("Voice ID copied to clipboard");
                    }}
                    className="p-2 text-slate-300 hover:text-brand-primary transition-all"
                    title="Copy Voice ID"
                  >
                    <Icons.Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteVoice(voice.voice_id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {voices.length === 0 && !isLoading && (
            <div className="col-span-full h-[250px] sm:h-[300px] bg-slate-50/50 rounded-[28px] sm:rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                <Icons.Mic className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h3 className="font-black text-brand-primary tracking-tight text-base sm:text-lg">No custom voices found</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-[250px]">Clone your first voice to get started with ElevenLabs.</p>
              </div>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="mt-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
              >
                Start Cloning
              </button>
            </div>
          )}
        </div>

        {/* Modal for voice creation */}
        {showCreateForm && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm" 
              onClick={() => setShowCreateForm(false)} 
            />
            <div className="relative w-full max-w-xl bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-slate-100 p-6 sm:p-8 flex flex-col gap-6 sm:gap-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 my-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-[14px] sm:rounded-[18px] flex items-center justify-center border border-slate-100">
                    <Icons.Activity className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-lg sm:text-xl font-black text-brand-primary tracking-tight lowercase leading-none">Voice Clone Initiation</h2>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 sm:mt-2">Create a custom ElevenLabs voice profile</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all hover:rotate-90"
                >
                  <Icons.Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreateVoice} className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-brand-primary ml-1">Voice Identifier (Name)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. CEO Custom Voice"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full h-12 sm:h-14 bg-slate-50 border border-transparent rounded-[16px] sm:rounded-[20px] px-5 sm:px-6 text-sm font-bold text-brand-primary placeholder:text-slate-300 focus:bg-white focus:border-slate-100 transition-all outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-brand-primary ml-1">Profile Description</label>
                  <textarea 
                    placeholder="Describe the tone, accent, and style of this voice..."
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    className="w-full h-24 sm:h-32 bg-slate-50 border border-transparent rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-sm font-medium text-brand-primary placeholder:text-slate-300 focus:bg-white focus:border-slate-100 transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-brand-primary ml-1">Audio Samples (Audio Files)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 sm:h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] sm:rounded-[28px] flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Icons.Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col items-center px-4 text-center">
                      <span className="text-[10px] sm:text-[11px] font-black text-brand-primary uppercase tracking-widest">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} Samples Selected` : "Click to Upload Samples"}
                      </span>
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-normal mt-1">MP3, WAV, or M4A (Max 10MB each)</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      multiple
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto p-1">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-2">
                          <Icons.Mic className="w-3 h-3" />
                          {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isCreating}
                  className="w-full h-14 sm:h-16 bg-linear-to-br from-brand-primary via-brand-primary to-brand-secondary text-white rounded-[20px] sm:rounded-[24px] text-[12px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-3 sm:gap-4 disabled:opacity-70 mt-2"
                >
                  {isCreating ? (
                    <>
                      <Icons.Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Cloning Voice Profile...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Finalize Clone</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
