"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { apiFetch } from "@/lib/api";
import { cn, normalizeAssetUrl } from "@/lib/utils";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";
import { toast } from "react-toastify";

import { AudioLeadModal } from "@/components/agents/audio-lead/AudioLeadModal";
import { AudioVault } from "@/components/agents/audio-lead/AudioVault";
import ConfirmationModal from "@/components/ui/ConfirmationModal";


interface AudioAsset {
  filename: string;
  url: string;
  type: "music" | "voiceover" | "full";
  timestamp: string;
  session_id: string;
  business_name?: string;
}

function AudioLeadContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string>(() => 
    searchParams.get("session_id") || ""
  );
  const [vault, setVault] = useState<AudioAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMusicUrl, setSelectedMusicUrl] = useState<string>("");
  const [selectedVoiceoverUrl, setSelectedVoiceoverUrl] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://apiplatform.raver.ai/api";

  const fetchVault = async (sid: string) => {
    if (!sid) return;
    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE}/ai/audio-lead/vault/${sid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setVault(data.data.map((item: any) => {
            let type: "music" | "voiceover" | "full" = "full";
            const label = (item.label || "").toLowerCase();
            const filename = (item.filename || "").toLowerCase();
            
            if (label.includes("music") || filename.includes("music")) type = "music";
            else if (label.includes("voice") || filename.includes("voiceover")) type = "voiceover";
            else if (label.includes("mix") || label.includes("full")) type = "full";

            return {
              ...item,
              type,
              url: normalizeAssetUrl(item.url),
              timestamp: item.timestamp || new Date().toISOString(),
              business_name: data.businessName || data.business_name
            };
          }));
        }
        fetchGlobalVault();
      }
    } catch (err) {
      console.warn("Vault sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchGlobalVault = async () => {
    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE}/ai/audio-lead/results`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const mapped: AudioAsset[] = [];
          data.data.forEach((record: any) => {
            if (record.mixUrl) {
              mapped.push({
                filename: record.mixUrl.split('/').pop() || "mix.mp3",
                url: normalizeAssetUrl(record.mixUrl),
                type: "full",
                timestamp: record.createdAt,
                session_id: record.sessionId,
                business_name: record.businessName
              });
            }
            if (record.musicUrl) {
              mapped.push({
                filename: record.musicUrl.split('/').pop() || "music.mp3",
                url: normalizeAssetUrl(record.musicUrl),
                type: "music",
                timestamp: record.createdAt,
                session_id: record.sessionId,
                business_name: record.businessName
              });
            }
            if (record.voiceoverUrl) {
              mapped.push({
                filename: record.voiceoverUrl.split('/').pop() || "voiceover.mp3",
                url: normalizeAssetUrl(record.voiceoverUrl),
                type: "voiceover",
                timestamp: record.createdAt,
                session_id: record.sessionId,
                business_name: record.businessName
              });
            }
          });
          setVault(mapped);
        }
      }
    } catch (err) {
      console.warn("Global archives sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchVault(sessionId);
    } else {
      fetchGlobalVault();
    }
  }, [sessionId, refreshTrigger]);

  // Handle auto-opening the modal via search params
  useEffect(() => {
    if (searchParams.get("generate") === "true") {
      setIsModalOpen(true);
      // Clean up URL after opening
      const newUrl = window.location.pathname + (sessionId ? `?session_id=${sessionId}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, sessionId]);

  const handleGenerateMusic = async (data: any) => {
    setIsLoading(true);
    setIsModalOpen(false);
    const timestamp = new Date().getTime();
    const sid = sessionId || `raver_audio_${timestamp}`;
    if (!sessionId) setSessionId(sid);

    try {
      const response = await apiFetch(`${API_BASE}/ai/audio-lead/music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, session_id: sid })
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
        // Start polling for results
        const interval = setInterval(async () => {
           const vResponse = await apiFetch(`${API_BASE}/ai/audio-lead/vault/${sid}`);
           if (vResponse.ok) {
              const vData = await vResponse.json();
              if (vData.data && vData.data.length > 0) {
                 setVault(vData.data.map((item: any) => ({
                   ...item,
                   url: normalizeAssetUrl(item.url)
                 })));
                 clearInterval(interval);
                 setIsLoading(false);
              }
           }
        }, 3000);

        // Max polling time 45s
        setTimeout(() => { clearInterval(interval); setIsLoading(false); }, 45000);
      } else {
        setIsLoading(false);
        toast.error("Music synthesis failed.");
      }
    } catch (err) {
      console.error("Music generation error:", err);
      setIsLoading(false);
    }
  };

  const handleGenerateVoiceover = async (data: any) => {
    setIsLoading(true);
    setIsModalOpen(false);
    const timestamp = new Date().getTime();
    const sid = sessionId || `raver_audio_${timestamp}`;
    if (!sessionId) setSessionId(sid);

    try {
      const response = await apiFetch(`${API_BASE}/ai/audio-lead/voiceover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, session_id: sid })
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
        // Polling
        const interval = setInterval(async () => {
           const vResponse = await apiFetch(`${API_BASE}/ai/audio-lead/vault/${sid}`);
           if (vResponse.ok) {
              const vData = await vResponse.json();
              if (vData.data && vData.data.length > 0) {
                 setVault(vData.data.map((item: any) => ({
                   ...item,
                   url: normalizeAssetUrl(item.url)
                 })));
                 clearInterval(interval);
                 setIsLoading(false);
              }
           }
        }, 3000);
        setTimeout(() => { clearInterval(interval); setIsLoading(false); }, 45000);
      } else {
        setIsLoading(false);
        toast.error("Voiceover synthesis failed.");
      }
    } catch (err) {
      console.error("Voiceover error:", err);
      setIsLoading(false);
    }
  };

  const handleProduceFull = async (data: any) => {
    setIsLoading(true);
    setIsModalOpen(false);
    const timestamp = new Date().getTime();
    const sid = sessionId || `raver_audio_${timestamp}`;
    if (!sessionId) setSessionId(sid);

    try {
      const response = await apiFetch(`${API_BASE}/ai/audio-lead/produce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, session_id: sid })
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
        // Polling
        const interval = setInterval(async () => {
           const vResponse = await apiFetch(`${API_BASE}/ai/audio-lead/vault/${sid}`);
           if (vResponse.ok) {
              const vData = await vResponse.json();
              if (vData.data && vData.data.length > 0) {
                 setVault(vData.data.map((item: any) => ({
                   ...item,
                   url: normalizeAssetUrl(item.url)
                 })));
                 clearInterval(interval);
                 setIsLoading(false);
              }
           }
        }, 3000);
        setTimeout(() => { clearInterval(interval); setIsLoading(false); }, 60000); // 60s for full production
      } else {
        setIsLoading(false);
        toast.error("Full production synthesis failed.");
      }
    } catch (err) {
      console.error("Production error:", err);
      setIsLoading(false);
    }
  };

  const handleMixAudio = async () => {
    const music = vault.find(v => v.type === "music");
    const voiceover = vault.find(v => v.type === "voiceover");
    
    // If no selections, use defaults
    const finalMusicUrl = selectedMusicUrl || music?.url;
    const finalVoiceoverUrl = selectedVoiceoverUrl || voiceover?.url;

    if (!finalMusicUrl || !finalVoiceoverUrl) {
      toast.warn("Please select both a Music track and a Voiceover track to mix.");
      return;
    }

    const effectiveSessionId = sessionId || `raver_mix_${new Date().getTime()}`;
    if (!sessionId) setSessionId(effectiveSessionId);

    setIsLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/ai/audio-lead/mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id: effectiveSessionId,
          music_url: finalMusicUrl.replace(/^https?:\/\/[^\/]+/, ""),
          voiceover_url: finalVoiceoverUrl.replace(/^https?:\/\/[^\/]+/, ""),
          music_volume: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.audio_files?.length > 0) {
          setRefreshTrigger(prev => prev + 1);
          setIsLoading(false);
          toast.success("Mix completed successfully!");
          await fetchGlobalVault();
          setTimeout(() => window.location.reload(), 2000);
          return;
        }
        const interval = setInterval(async () => {
           const vResponse = await apiFetch(`${API_BASE}/ai/audio-lead/vault/${effectiveSessionId}`);
           if (vResponse.ok) {
              const vData = await vResponse.json();
              const hasMix = vData.data && vData.data.some((f: any) => 
                (f.label || "").toLowerCase().includes("mix") || 
                (f.filename || "").toLowerCase().includes("mixed")
              );
              
              if (hasMix) {
                 console.log("Mix found in vault");
                 clearInterval(interval);
                 setRefreshTrigger(prev => prev + 1);
                 setIsLoading(false);
                 toast.success("Mix ready!");
                 setTimeout(() => window.location.reload(), 1000);
              }
           }
        }, 3000);
        setTimeout(() => { 
          clearInterval(interval); 
          setIsLoading(false); 
          setRefreshTrigger(prev => prev + 1);
          window.location.reload(); 
        }, 45000);
      } else {
        console.error("Mixing request failed:", response.status);
        setIsLoading(false);
        toast.error("Mixing failed. Please check the console.");
      }
    } catch (err) {
      console.error("Mixing error:", err);
      setIsLoading(false);
      toast.error("An error occurred during mixing.");
    }
  };

  const handleDeleteSession = (sid: string) => {
    setDeleteTargetId(sid);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    setIsDeleting(true);
    try {
      const res = await apiFetch(`${API_BASE}/ai/audio-lead/session/${deleteTargetId}`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        if (deleteTargetId === sessionId) {
          setSessionId("");
          setVault([]);
        }
        await fetchGlobalVault();
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await apiFetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = url.split("/").pop() || `neural_audio_${new Date().getTime()}.mp3`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Synthesis link copied to clipboard");
  };

  const hasMusic = vault.some(v => v.type === "music");
  const hasVoiceover = vault.some(v => v.type === "voiceover");
  const hasFull = vault.some(v => v.type === "full");
  const canMix = hasMusic && hasVoiceover && !hasFull;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 mx-auto bg-white rounded-3xl min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col gap-6 p-5 sm:p-8 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/agents" 
                className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90 group"
              >
                <Icons.ArrowLeft className="w-5 h-5 text-brand-primary group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <div className="flex flex-col">
                 <h1 className="text-[28px] sm:text-[34px] font-black text-brand-primary tracking-normal lowercase leading-none">RAVER AI AUDIO LEAD</h1>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3">Synthesizing the Atmosphere of Production</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {sessionId && (
                <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 bg-slate-50 rounded-[18px] border border-slate-100/50">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-normal">Active Sync Session</span>
                      <span className="text-[10px] font-black text-brand-primary font-mono">{sessionId}</span>
                   </div>
                   <button 
                    onClick={() => handleDeleteSession(sessionId)}
                    className="ml-2 p-1.5 hover:bg-white rounded-lg transition-all text-slate-300 hover:text-red-500"
                   >
                     <Icons.Trash className="w-3.5 h-3.5" />
                   </button>
                </div>
              )}
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="h-14 px-8 bg-linear-to-r from-brand-primary to-brand-secondary  text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-primary/10 border border-white/5"
              >
                <Icons.Activity className="w-4 h-4" />
                Initiate Synthesis
              </button>
            </div>
          </div>
        </div>

        {/* Neural Mixing Suggestion */}
          <div className="mx-8 mb-4 p-6 bg-linear-to-r from-brand-primary to-brand-secondary rounded-[24px] flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-blue-900/10 border border-white/5">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Icons.whiteMagicWand className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-white font-black text-lg tracking-tight lowercase">Ready for neural mixing_</h4>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  {(!selectedMusicUrl && !selectedVoiceoverUrl) 
                    ? "Select 1 Music + 1 Voiceover from vault below" 
                    : (!selectedMusicUrl) 
                    ? "Select a Music track to complete the pair" 
                    : (!selectedVoiceoverUrl) 
                    ? "Select a Voiceover track to complete the pair" 
                    : "Custom neural pair locked: Ready to Mix"}
                </p>
              </div>
            </div>
            <button 
              onClick={handleMixAudio}
              disabled={!(selectedMusicUrl && selectedVoiceoverUrl) && !canMix}
              className={cn(
                "h-12 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg",
                ((selectedMusicUrl && selectedVoiceoverUrl) || canMix)
                  ? "bg-white text-brand-primary hover:scale-105 active:scale-95 shadow-white/10"
                  : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
              )}
            >
              {((selectedMusicUrl && selectedVoiceoverUrl) || canMix) ? "Mix Neural Atmosphere" : "Select Components"}
            </button>
          </div>

        {/* Neural Vault Section */}
        <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.01)] h-full">
           <AudioVault 
             assets={vault}
             isLoading={isSyncing}
             onDownload={handleDownload}
             onDelete={handleDeleteSession}
             onCopyUrl={handleCopyUrl}
             isGlobalArchive={!sessionId}
             selectedMusicUrl={selectedMusicUrl}
             selectedVoiceoverUrl={selectedVoiceoverUrl}
             onSelectMusic={setSelectedMusicUrl}
             onSelectVoiceover={setSelectedVoiceoverUrl}
           />
        </div>

        {/* Neural Orchestration Modal */}
        <AudioLeadModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGenerateMusic={handleGenerateMusic}
          onGenerateVoiceover={handleGenerateVoiceover}
          onProduceFull={handleProduceFull}
          isLoading={isLoading}
        />

        <ConfirmationModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Archive Synthesis"
          message="Are you sure you want to permanently archive this neural synthesis? This action cannot be undone."
          confirmText="Archive"
          isLoading={isDeleting}
        />

      </div>
    </DashboardLayout>
  );
}

export default function AudioLeadPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <RaverLoadingState 
            title="Calibrating Neural Acoustics" 
            description="Preparing the audio synthesis engine and synchronizing your creative vault..." 
          />
        </div>
      </DashboardLayout>
    }>
      <AudioLeadContent />
    </Suspense>
  );
}
