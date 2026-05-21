"use client";

import Image from "next/image";
import { Icons } from "@/components/ui/icons";
import { useState, useCallback, useEffect, useRef } from "react";
import CampaignSelectionModal from "./CampaignSelectionModal";
import AssetSelectionModal from "./AssetSelectionModal";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn, normalizeAssetUrl } from "@/lib/utils";
import { apiFetch } from "@/lib/api";


import { VoiceSelector, VOICE_OPTIONS } from "@/components/agents/audio-lead/VoiceSelector";

import { useUser } from "@/context/UserContext";

interface Asset {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "graphic";
  createdAt?: string;
  fileSize?: string | number;
  dbId?: string;
  origin?: string;
  userId?: string;
  campaignId?: string;
  rawMetadata?: any;
}

interface Campaign {
  id?: string;
  title: string;
  status: string;
  image: string | string[];
  audience?: string;
  objective?: string;
  format?: string;
  duration?: string;
  colorScheme?: string;
  platforms?: string[];
  tones?: string[];
  visualStyles?: string[];
  createdAt?: string;
}

interface StudioHeroProps {
  onCreateClick: () => void;
  campaigns?: Campaign[];
  onCampaignSelect?: (campaign: Campaign | null) => void;
  selectedCampaign?: Campaign | null;
  onCampaignDelete?: (campaign: Campaign) => void;
  onViewDetails?: (campaign: Campaign) => void;
  onViewDetailsforcampaigns?: (campaign: Campaign) => void;
  onSend?: (prompt: string, assets?: Asset[]) => void;
  isSending?: boolean;
}

const quickPrompts = [
  "Instagram promotion for summer balayage special",
  "Salon discount campaign 20% off new clients",
  "Before/after showcase reel for social media",
  "Holiday campaign for Christmas hair makeovers",
];

export default function StudioHero({
  onCreateClick,
  campaigns = [],
  onCampaignSelect,
  selectedCampaign,
  onCampaignDelete,
  onViewDetails,
  onViewDetailsforcampaigns,
  onSend,
  isSending
}: StudioHeroProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("adam");
  const [voiceError, setVoiceError] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [dbCampaigns, setDbCampaigns] = useState<Campaign[]>([]);
  const [allVoices, setAllVoices] = useState<any[]>(VOICE_OPTIONS);
  const { user } = useUser();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch custom voices to ensure we can resolve names in prompts
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const response = await apiFetch(`${API_BASE}/custom-voice/list?t=${Date.now()}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            const mapped = result.data.map((v: any) => ({
              id: v.voice_id,
              name: v.name
            }));
            setAllVoices([...VOICE_OPTIONS, ...mapped]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch voices in StudioHero:", error);
      }
    };
    fetchVoices();
  }, []);

  // Fetch campaigns from the database for the reference section
  useEffect(() => {
    const fetchCampaignsFromDB = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await apiFetch(`${API_BASE}/campaigns?t=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          // Adjust based on typical API response structure { success: true, data: [...] }
          const data = json.data || json;
          if (Array.isArray(data)) {
            setDbCampaigns(data.map((c: any) => ({
              id: c.id,
              title: c.name || "Untitled Project",
              status: c.status || "ready",
              image: c.image || "/assets/hashtag-campaign.jpg",
              ...c
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch campaigns from /api/campaigns:", err);
      }
    };
    fetchCampaignsFromDB();
  }, []);

  // Real-time voice input
  const handleVoiceResult = useCallback((text: string) => {
    setPrompt((prev) => (prev + " " + text).trim());
  }, []);

  const { isListening, interimText, startListening, stopListening } = useVoiceInput(handleVoiceResult);

  // Auto-resize textarea with a max height limit to prevent continuous expansion and show scrollbars instead
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 240; // Limit dynamic expansion to 240px
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.style.overflowY = "hidden";
      }
    }
  }, [prompt, interimText]);



  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePromptSelect = (text: string) => {
    setPrompt(text);
  };

  const handleSend = () => {
    if (!prompt.trim()) return;

    const activeVoice = selectedVoice || "adam";
    setVoiceError(false);

    // Append voice selection to the prompt so AI Director knows
    const voiceName = allVoices.find(v => v.id === activeVoice)?.name || activeVoice;
    const enrichedPrompt = `${prompt.trim()}\n\n[Voice: ${activeVoice} (${voiceName})]`;

    onSend?.(enrichedPrompt, selectedAssets);
    setPrompt("");
    setSelectedAssets([]);
    audioRef?.pause();
    setPlayingId(null);
    stopListening();
  };

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef] = useState(typeof Audio !== "undefined" ? new Audio() : null);

  useEffect(() => {
    if (audioRef) {
      audioRef.onended = () => setPlayingId(null);
    }
    return () => {
      audioRef?.pause();
    };
  }, [audioRef]);

  const togglePlay = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation();
    if (!audioRef) return;

    if (playingId === asset.id) {
      audioRef.pause();
      setPlayingId(null);
    } else {
      audioRef.src = normalizeAssetUrl(asset.url);
      audioRef.play();
      setPlayingId(asset.id);
    }
  };

  const removeAsset = (id: string) => {
    if (playingId === id) {
      audioRef?.pause();
      setPlayingId(null);
    }
    setSelectedAssets(prev => prev.filter(a => a.id !== id));
  };

  // Compose display value: committed text + interim (greyed) text
  const displayValue = prompt + (interimText ? " " + interimText : "");

  return (
    <div className="bg-white rounded-3xl p-8 min-h-[340px] border border-[#F1F5F9] shadow-sm relative flex flex-col gap-[16px]">
      <div className="flex justify-between gap-8 h-[235px]">
        {/* Left Content Stack */}
        <div className="flex flex-col gap-6 max-w-[379px] flex-1">
          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] font-bold text-[#4F4F4F] leading-tight mb-2">
              Hi, {user?.fullName?.split(' ')[0] || "there"} <span className="text-[#121212]">Ready To Achieve Great Things?</span>
            </h1>
          </div>
        </div>
        <div className="relative w-[296px] h-[242px] hidden lg:block shrink-0">
          <Image
            src="/assets/093ec72b55a47816f743d0aef409d7eba6458444.png"
            alt="AI Character"
            fill
            className="object-contain object-bottom"
          />
        </div>
      </div>
      <div className="relative group flex flex-col gap-6">
        <div className="relative flex flex-col gap-3">
        {selectedCampaign && (
          <div className="absolute -top-3 right-4 flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full z-20 shadow-sm animate-in fade-in slide-in-from-top-1">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">Campaign: {selectedCampaign.title}</span>
            <button 
              onClick={() => onCampaignSelect?.(null)}
              className="text-[#94A3B8] hover:text-red-500 transition-colors"
              title="Clear campaign context"
            >
              <Icons.Plus className="w-3 h-3 rotate-45" />
            
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={selectedCampaign ? `Prompt for: ${selectedCampaign.title}` : "Create a summer balayage instagram promotion"}
          className="w-full min-h-[140px] max-h-[240px] p-5 bg-white rounded-2xl border border-[#E2E8F0] focus:border-[#02022C] text-[15px] text-[#121212] placeholder:text-[#94A3B8] transition-all resize-none outline-none overflow-y-hidden shadow-sm"
        />
        
        {/* Selected Assets Display */}
        {selectedAssets.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {selectedAssets.map((asset) => (
              <div key={asset.id} className="relative group/asset w-14 h-14 rounded-lg overflow-hidden border border-[#E2E8F0] shadow-sm shrink-0">
                <img src={normalizeAssetUrl(asset.url)} alt="" className="w-full h-full object-cover transition-transform group-hover/asset:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/asset:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => removeAsset(asset.id)}
                    className="text-white hover:text-red-400 transition-colors p-1"
                  >
                    <Icons.Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Structured Action Bar */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Mic Button */}
            <div className="relative">
              <button
                onClick={handleMicClick}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                  isListening
                    ? "bg-red-50 text-red-500 border-red-200 animate-pulse shadow-lg shadow-red-500/20"
                    : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#121212] hover:border-[#CBD5E1]"
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                <Icons.Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Add Assets Button */}
            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#121212] hover:border-[#CBD5E1] flex items-center justify-center transition-all shadow-sm"
              title="Add reference images"
            >
              <Icons.Image className="w-4 h-4" />
            </button>
          </div>

          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={isSending || !prompt.trim()}
            className={cn(
              "px-5 h-10 rounded-xl flex items-center gap-2 transition-all font-bold text-[13px] shadow-sm",
              prompt.trim() 
                ? "bg-[#02022C] text-white shadow-[#02022C]/20 active:scale-95 hover:bg-[#02022C]/90" 
                : "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
            )}
          >
            {isSending ? (
              <Icons.Loader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Generate</span>
                <Icons.Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-brand-primary uppercase tracking-[0.2em]">
              </span>
            </div>
            {selectedVoice && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full animate-in fade-in slide-in-from-right-2 duration-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-normal">Ready For Production</span>
              </div>
            )}
          </div>
          
          <VoiceSelector 
            selectedVoice={selectedVoice}
            onSelect={(id) => {
              setSelectedVoice(id);
              setVoiceError(false);
            }}
            className={cn(
              "transition-all duration-300",
              voiceError && "ring-4 ring-red-500/20 rounded-[22px]"
            )}
          />
        </div>

        <div className="flex flex-col gap-6">
          {/* Quick Campaign Select */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#64748B]">Reference Campaign:</span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg text-[12px] font-bold text-[#121212] transition-all flex items-center gap-1 group hover:bg-linear-to-r hover:from-brand-primary hover:to-brand-secondary hover:text-white active:scale-95"
              >
                View More <Icons.ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dbCampaigns.slice(0, 4).map((campaign, i) => (
                <div
                  key={i}
                  onClick={() => onCampaignSelect?.(campaign)}
                  className={`px-3 py-1.5 border rounded-lg text-[11px] flex items-center font-medium transition-all cursor-pointer ${
                    selectedCampaign?.title === campaign.title 
                      ? "bg-[#02022C] border-[#02022C] text-white" 
                      : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#02022C] hover:text-[#02022C]"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{campaign.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetailsforcampaigns?.(campaign);
                    }}
                    className={`ml-2 transition-colors ${
                      selectedCampaign?.title === campaign.title ? "text-white/70 hover:text-white" : "text-[#64748B] hover:text-[#02022C]"
                    }`}
                  >
                    <Icons.Eye className="w-3.5 h-3.5" />
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCampaignDelete?.(campaign);
                      setDbCampaigns(dbCampaigns => dbCampaigns.filter(c => c.id !== campaign.id));
                    }} 
                    className={`ml-2 transition-colors ${
                      selectedCampaign?.title === campaign.title ? "text-white/70 hover:text-red-400" : "hover:text-red-500 text-[#64748B]"
                    }`}
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CampaignSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaigns={dbCampaigns}
        onSelect={(c) => onCampaignSelect?.(c)}
        onCreateNew={onCreateClick}
        onDelete={onCampaignDelete}
      />

      <AssetSelectionModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSelect={setSelectedAssets}
        selectedAssets={selectedAssets}
        onlyImages={true}
      />
    </div>
  );
}
