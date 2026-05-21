"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";
import { toast } from "react-toastify";
import ImageViewerModal from "@/components/agents/ImageViewerModal";
import { normalizeAssetUrl } from "@/lib/utils";
import { VoiceSelector, VOICE_OPTIONS } from "@/components/agents/audio-lead/VoiceSelector";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<string>("adam");

  useEffect(() => {
    const fetchCampaign = async () => {
      try {

        const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaign/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCampaign(data.data);
          } else {
            setError("Campaign not found in the neural archives.");
          }
        } else {
          setError("Failed to synchronize with synchronization matrix.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Neural thread synchronization failed.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCampaign();
      // Proactively fetch latest DB state for hitl/approval info
      const fetchHitlData = async () => {
        try {
          const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/director/session/${id}/db-update`);
          if (res.ok) {
            const resData = await res.json();
            if (resData.data) {
              setCampaign((prev: any) => ({ ...prev, hitl: resData.data }));
            }
          }
        } catch (e) {
          console.warn("HITL data fetch failed:", e);
        }
      };
      fetchHitlData();
    }
  }, [id]);

  // Use a second useEffect for polling to avoid reset issues
  useEffect(() => {
    if (!id || !campaign) return;

    // Stop polling if the campaign has reached a terminal state
    const terminalStatuses = ["delivered", "completed", "failed", "ready_for_human_review"];
    if (terminalStatuses.includes(campaign.status)) return;

    const interval = setInterval(async () => {
       try {
         const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaign/${id}`);
         if (response.ok) {
           const data = await response.json();
           if (data.success && data.data) {
              setCampaign(data.data);
           }
         }
       } catch (err) {
         console.warn("Polling update failed:", err);
       }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, campaign?.status]);

  if (isLoading) {
    return (
      <RaverLoadingState
        title="Accessing Auditing Matrix"
        description="Retrieving production dossiers and quality reports from the neural archives..."
      />
    );
  }

  if (error || !campaign) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center p-8">
          <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center border border-slate-100 mb-4">
            <Icons.Activity className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-brand-primary tracking-normal lowercase">{error || "Production Not Sourced"}</h2>
          <button
            onClick={() => router.push("/agents/producer")}
            className="h-12 px-8 bg-linear-to-r from-brand-primary to-brand-secondary  text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/10 active:scale-95 transition-all"
          >
            Return to Orchestration Hub
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const brief = campaign.config?.brief || campaign.brief || {};
  const nodes = campaign.config?.nodes || campaign.nodes || {};
  const result = campaign.config?.result || campaign.result || {};
  const quality = result.quality_report || nodes.score_quality?.result || {};
  const campaignName = campaign.name || brief.business_name || "unnamed_production";
  const campaignId = campaign.id || campaign.campaign_id || id;
  
  // Extract Social Content
  const social = result.platform_copy || nodes.generate_text?.result?.platform_copy || {};
  const platform = brief.platform || "instagram";
  const platformContent = social[platform] || Object.values(social)[0] || {};

  // Extract Script Details
  const scriptObj = nodes.generate_text?.result?.script || result.script_obj || result.script || {};
  const fullScript = typeof scriptObj === 'string' ? scriptObj : scriptObj.script || "";
  const sceneScripts = Array.isArray(scriptObj.scenes_scripts) ? scriptObj.scenes_scripts : [];
  const overlays = result.overlays || nodes.generate_text?.result?.overlays || [];

  const getNodeStatus = (nodeKey: string) => {
    const node = nodes[nodeKey];
    if (!node) return "pending";
    if (node.status === "failed" || node.error || (node.result?.status === "failed")) return "failed";
    if (node.status === "completed" || node.status === "success") return "done";
    if (node.status === "running" || node.status === "processing" || node.status === "started") return "running";
    return "pending";
  };

  const handleDownload = async (url: string) => {
    toast.info('Preparing secure download...');
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=raver-production-${campaignId}.mp4`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading("Finalizing production archives...");
    try {
      const sessionId = campaign.session_id ;
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/director/session/${sessionId}/approve`, {
        method: "PATCH"
      });

      if (response.ok) {
        setCampaign((prev: any) => ({ ...prev, status: "approved" }));
        toast.update(toastId, {
          render: "✓ Production synchronization finalized!",
          type: "success",
          isLoading: false,
          autoClose: 3000
        });
        
        // Match the reload behavior of the modal
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error("Failed to approve production");
      }
    } catch (err: any) {
      toast.update(toastId, {
        render: `Finalization failed: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleStepAction = async (action: "approve" | "improve" | "reject") => {
    const currentStatus = campaign.status?.toLowerCase() || "";
    const stepName = currentStatus.startsWith("awaiting_approval_")
      ? currentStatus.replace("awaiting_approval_", "")
      : "render";

    setIsProcessingStep(true);
    const toastId = toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing ${stepName.replace("_", " ")}...`);

    try {
      const bodyData: any = {
        step_name: stepName,
        action: action,
        notes: stepNotes || (action === "approve" ? "Looks good" : "Requires changes")
      };

      if (selectedAssetId) {
        bodyData.selected_asset_id = selectedAssetId;
      }
      
      if (stepName === "generate_voice") {
        const activeVoice = selectedVoice || "adam";
        bodyData.voice_id = activeVoice;
        const voiceOption = VOICE_OPTIONS.find(v => v.id === activeVoice);
        const voiceName = voiceOption ? voiceOption.name : activeVoice;
        bodyData.notes = `[Selected Voice: ${voiceName} - ${activeVoice}] ${bodyData.notes}`;
      }

      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaign/${campaign.session_id}/approve-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) throw new Error(`Failed to ${action} step`);

      toast.update(toastId, {
        render: `Successfully ${action}d ${stepName.replace("_", " ")}!`,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setStepNotes("");
      setSelectedAssetId(null);
      
      // Refresh campaign data
      const refreshRes = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaign/${id}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setCampaign(refreshData.data);
      }
    } catch (error: any) {
      console.error(`Step ${action} error:`, error);
      toast.update(toastId, {
        render: `Error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsProcessingStep(false);
    }
  };

  const steps = [
    { id: "generate_image", label: "Visual Matrix", icon: Icons.Image },
    { id: "generate_text", label: "Narrative Synthesis", icon: Icons.Mic },
    { id: "generate_voice", label: "Neural Voice", icon: Icons.AudioWave },
    { id: "generate_music", label: "Atmospheric Score", icon: Icons.AudioWave },
    { id: "render", label: "Neural Rendering", icon: Icons.Video },
    { id: "score_quality", label: "Quality Audit", icon: Icons.Success },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden flex flex-col bg-white border-slate-100 rounded-[10px]">

        {/* Persistent Header Section */}
        <div className="px-5 sm:px-8 md:px-10 py-6 sm:py-8 md:py-10 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 md:gap-10 shrink-0 relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 md:gap-8 overflow-hidden">
            <button
              onClick={() => router.push("/agents/producer")}
              className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-100 transition-all active:scale-90 shrink-0"
            >
              <Icons.ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
            </button>
            <div className="flex flex-col gap-1 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-hidden">
                <h1 className="text-[20px] sm:text-[28px] md:text-[32px] font-black text-[#121212] tracking-normal  leading-tight truncate">
                  {campaignName}
                </h1>
                <div className={cn(
                  "px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border shadow-sm w-fit",
                  campaign.status === "delivered" || campaign.status === "ready_for_human_review" || campaign.status === "completed"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                    : "bg-slate-50 text-slate-500 border-slate-100"
                )}>
                  {campaign.status}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.3em] text-slate-400 mt-1 sm:mt-2">
                <span className="truncate">CAMPAIGN_ID: {campaignId}</span>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-200" />
                <span className="truncate">Neural Thread: {new Date(campaign.createdAt || campaign.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {(campaign.status?.toLowerCase().startsWith("awaiting_approval_") || campaign.status === "ready_for_human_review") && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-2xl animate-pulse">
                <Icons.Zap className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Review Required</span>
              </div>
            )}

            {campaign.status === "ready_for_human_review" && (
              <>
                <button 
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-1 sm:flex-none h-11 sm:h-14 px-6 sm:px-10 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-xl sm:rounded-[22px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isApproving ? <Icons.Loader className="w-3 h-3 animate-spin"/> : <Icons.CheckCircle className="w-3.5 h-3.5"/>}
                  Approve Production
                </button>
              </>
            )}
            
            {campaign.status === "approved" && (
              <div className="h-11 sm:h-14 px-6 sm:px-8 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl sm:rounded-[22px] flex items-center gap-2">
                <Icons.Success className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Production Finalized</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Body Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-12 pb-32">
            
            {/* HITL: Action Required Section */}
            {campaign.status?.toLowerCase().startsWith("awaiting_approval_") && (
              <div className="bg-[#FDFDFF] border border-amber-100 rounded-[32px] p-8 md:p-12 shadow-sm relative flex flex-col gap-8 z-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] -mr-32 -mt-32 overflow-hidden rounded-tr-[32px]" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-amber-500 rounded-[24px] flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
                      <Icons.Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-2xl font-black text-brand-primary tracking-normal lowercase">Human Intervention Required</h2>
                      <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mt-1">Reviewing: {campaign.status.replace("awaiting_approval_", "").replace("_", " ")}</p>
                    </div>
                  </div>
                </div>

                {/* Candidate Selection for Images */}
                {campaign.status.includes("image") && (() => {
                  const candidates = campaign.hitl?.candidates || 
                                   campaign.hitl?.image_urls || 
                                   campaign.nodes?.generate_image?.result?.scene_images || 
                                   [];
                  
                  if (candidates.length === 0) return null;

                  return (
                    <div className="flex flex-col gap-6 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Select generation candidate</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                        {candidates.map((candidate: any, idx: number) => {
                          const assetUrl = candidate.url || candidate.image_url || (typeof candidate === "string" ? candidate : null);
                          const assetId = candidate.id || idx.toString();
                          return (
                            <div 
                              key={assetId}
                              onClick={() => setSelectedAssetId(assetId)}
                              className={cn(
                                "relative aspect-square rounded-[24px] overflow-hidden border-4 cursor-pointer transition-all hover:scale-[1.02] group shadow-sm",
                                selectedAssetId === assetId ? "border-brand-primary ring-8 ring-brand-primary/10" : "border-white opacity-60 hover:opacity-100"
                              )}
                            >
                              <img src={normalizeAssetUrl(assetUrl)} alt={`Candidate ${idx + 1}`} className="w-full h-full object-cover" />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(normalizeAssetUrl(assetUrl));
                                  setIsPreviewOpen(true);
                                }}
                                className="absolute bottom-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-white/40"
                                title="Audit Candidate"
                              >
                                <Icons.Search className="w-5 h-5 text-white" />
                              </button>
                              {selectedAssetId === assetId && (
                                <div className="absolute top-4 right-4 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg">
                                  <Icons.CheckCircle className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Candidate Review for Text Generation */}
                {campaign.status.includes("text") && (() => {
                  const result = campaign.nodes?.generate_text?.result || {};
                  const scriptObj = result.script || {};
                  const sceneScripts = scriptObj.scenes_scripts || [];
                  const overlays = result.overlays || [];
                  const platformCopy = result.platform_copy || {};
                  const firstPlatform = Object.values(platformCopy)[0] as any || {};

                  return (
                    <div className="flex flex-col gap-8 relative z-10">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Script & Overlays */}
                        <div className="flex flex-col gap-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Generated Script & Overlays</span>
                          <div className="space-y-4">
                            {sceneScripts.map((text: string, idx: number) => (
                              <div 
                              key={idx} 
                              className={cn(
                                "p-5 bg-white border rounded-[20px] shadow-sm transition-all cursor-pointer",
                                selectedAssetId === `scene_${idx + 1}` ? "border-brand-primary ring-4 ring-brand-primary/5" : "border-slate-100 hover:border-slate-200"
                              )}
                              onClick={() => setSelectedAssetId(selectedAssetId === `scene_${idx + 1}` ? null : `scene_${idx + 1}`)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedAssetId === `scene_${idx + 1}`}
                                      onChange={() => setSelectedAssetId(selectedAssetId === `scene_${idx + 1}` ? null : `scene_${idx + 1}`)}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                                    />
                                    <span className="text-[9px] font-black text-brand-primary uppercase">Scene 0{idx + 1}</span>
                                  </div>
                                  <Icons.AudioWave className="w-3 h-3 text-blue-400" />
                                </div>
                                <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic mb-3">"{text}"</p>
                                {overlays[idx] && (
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[8px] font-black text-blue-500 uppercase">Screen Overlay</span>
                                    <p className="text-[11px] font-black text-brand-primary mt-0.5">{overlays[idx].text}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Social Platform Copy */}
                        <div className="flex flex-col gap-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Social Platform Content</span>
                          <div className="p-6 bg-slate-900 text-white rounded-[32px] border border-white/5 h-fit">
                            <div className="flex items-center gap-2 mb-4">
                              <Icons.MessageCircle className="w-4 h-4 text-white/50" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Optimized Caption</span>
                            </div>
                            <p className="text-[13px] font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                              {firstPlatform.caption || "No caption generated."}
                            </p>
                            {firstPlatform.hashtags && (
                              <div className="flex flex-wrap gap-2 pt-6 border-t border-white/10">
                                {firstPlatform.hashtags.map((tag: string, i: number) => (
                                  <span key={i} className="text-[10px] font-bold text-blue-400">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Candidate Review for Voice Generation */}
                {campaign.status.includes("voice") && (() => {
                  const result = campaign.nodes?.generate_voice?.result || {};
                  const voiceUrl = result.voiceover_url || "";
                  
                  if (!voiceUrl) return null;

                  return (
                    <div className="flex flex-col gap-6 relative z-30">
                      <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                            <Icons.Mic className="w-6 h-6 text-brand-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Neural Voice Generation</span>
                            <h4 className="text-lg font-black text-brand-primary tracking-normal lowercase">Review Master Voiceover</h4>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Neural Voice Casting</span>
                            <VoiceSelector 
                              className="no-label"
                              selectedVoice={selectedVoice || campaign.brief?.voice}
                              onSelect={(id) => setSelectedVoice(id)}
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Vocal Preview</span>
                            <div className="bg-slate-50 p-3 rounded-[24px] border border-slate-100 flex items-center h-14">
                              <audio 
                                src={normalizeAssetUrl(voiceUrl)} 
                                controls 
                                className="w-full h-10 accent-brand-primary" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <Icons.Success className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Neural synthesis complete</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Candidate Review for Music Generation */}
                {campaign.status.includes("music") && (() => {
                  const result = campaign.nodes?.generate_music?.result || {};
                  const musicUrl = result.music_url || "";
                  const promptUsed = result.prompt_used || "";
                  
                  if (!musicUrl) return null;

                  return (
                    <div className="flex flex-col gap-6 relative z-30">
                      <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                            <Icons.Music className="w-6 h-6 text-brand-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Neural Composition</span>
                            <h4 className="text-lg font-black text-brand-primary tracking-normal lowercase">Review Background Score</h4>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                          <audio 
                            src={normalizeAssetUrl(musicUrl)} 
                            controls 
                            className="w-full h-12 accent-brand-primary" 
                          />
                        </div>

                        {promptUsed && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40 pl-1">Generation Prompt</span>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed">
                              "{promptUsed}"
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit">
                          <Icons.Success className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Neural composition complete</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Candidate Review for Final Render */}
                {campaign.status.includes("render") && (() => {
                  const result = campaign.nodes?.render?.result || {};
                  const videoUrl = result.video_url || "";
                  
                  if (!videoUrl) return null;

                  return (
                    <div className="flex flex-col gap-6 relative z-30">
                      <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                            <Icons.Play className="w-6 h-6 text-brand-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Production Finalization</span>
                            <h4 className="text-lg font-black text-brand-primary tracking-normal lowercase">Review Master Render</h4>
                          </div>
                        </div>
                        
                        <div className="aspect-video bg-slate-900 rounded-[24px] overflow-hidden border border-slate-200/20 relative group">
                          <video 
                            src={normalizeAssetUrl(videoUrl)} 
                            controls 
                            className="w-full h-full object-contain" 
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Format</span>
                            <span className="text-[11px] font-black text-brand-primary">{result.format || "N/A"}</span>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Render Time</span>
                            <span className="text-[11px] font-black text-brand-primary">{result.render_seconds?.toFixed(1)}s</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl w-fit">
                          <Icons.Success className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Neural render finalized</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Feedback Input */}
                <div className="flex flex-col gap-4 relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">Feedback / Instructions (Optional)</span>
                   <textarea 
                     value={stepNotes}
                     onChange={(e) => setStepNotes(e.target.value)}
                     placeholder="Enter specific instructions for the AI Director..."
                     className="w-full p-6 bg-white border border-slate-100 rounded-[24px] text-sm font-medium focus:outline-none focus:border-amber-500 transition-all shadow-inner min-h-[120px]"
                   />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 relative z-10">
                  <button 
                    onClick={() => handleStepAction("approve")}
                    disabled={isProcessingStep}
                    className="h-14 px-10 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Icons.CheckCircle className="w-4 h-4" /> Approve Step
                  </button>
                  <button 
                    onClick={() => handleStepAction("improve")}
                    disabled={isProcessingStep || (campaign.status.includes("image") && !selectedAssetId)}
                    className="h-14 px-10 bg-white border border-slate-200 text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Icons.MagicWand className="w-4 h-4" /> Improve Asset
                  </button>
                  <button 
                    onClick={() => handleStepAction("reject")}
                    disabled={isProcessingStep}
                    className="h-14 px-10 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 border border-red-100"
                  >
                    Reject Production
                  </button>
                </div>
              </div>
            )}

            {/* HERO: Cinema Mode Video Showcase - Only if video exists or render is active */}
            {(result.video_url || getNodeStatus("render") === "running" || getNodeStatus("render") === "failed") && (
              result.video_url ? (
              <div className="bg-linear-to-r from-brand-primary to-brand-secondary  rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl shadow-black/20 relative group h-[60vh] sm:h-[70vh] lg:h-[80vh] transition-all duration-700">
                {/* Immersive Hover Overlays */}
                <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/80 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-start justify-between p-6 sm:p-8 md:p-12 pointer-events-none">
                  <div className="flex flex-col gap-1 sm:gap-2 pointer-events-auto">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-8 sm:h-8 rounded-full bg-emerald-500 sm:animate-pulse" />
                      <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest sm:tracking-[0.4em] text-white/70">Master Production</span>
                    </div>
                    <h2 className="text-[16px] sm:text-[24px] md:text-[32px] font-black text-white tracking-normal lowercase leading-none mt-1 shadow-black/20 drop-shadow-lg">Production Synthesis</h2>
                  </div>

                  <div className="flex gap-2 sm:gap-4 pointer-events-auto">
                    <button
                      onClick={() => handleDownload(result.video_url)}
                      className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-xl text-white border border-white/20 rounded-xl sm:rounded-[20px] flex items-center justify-center hover:bg-white/30 transition-all active:scale-90"
                      title="Download Master"
                    >
                      <Icons.Download className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>

                {/* Bottom Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/80 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="h-full w-full bg-slate-900 relative flex items-center justify-center overflow-hidden">
                  {/* Background ambiance for any format */}
                  <div className="absolute inset-0 blur-[100px] opacity-40 transform scale-150 pointer-events-none">
                    <video
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src={result.video_url} type="video/mp4" />
                    </video>
                  </div>

                  <div className={cn(
                    "relative z-10 h-full flex items-center justify-center py-4 sm:py-10 md:py-16 w-full",
                    brief.format === "9:16" ? "max-w-[320px] sm:max-w-[440px] md:max-w-[500px]" : brief.format === "1:1" ? "max-w-[85%] sm:max-w-[70vh]" : "max-w-6xl px-4"
                  )}>
                    <video
                      controls
                      autoPlay
                      loop
                      playsInline
                      className={cn(
                        "max-h-full rounded-[24px] md:rounded-[40px] shadow-2xl border border-white/10 object-contain h-full bg-black/60 transition-transform duration-700 group-hover:scale-[1.01]",
                        brief.format === "9:16" ? "aspect-9/16" :
                          brief.format === "1:1" ? "aspect-square" :
                            "aspect-video"
                      )}
                    >
                      <source src={result.video_url} type="video/mp4" />
                    </video>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] md:rounded-[40px] h-[40vh] flex flex-col items-center justify-center gap-6 text-center p-8">
                {getNodeStatus("render") === "failed" ? (
                  <>
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                      <Icons.Activity className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="flex flex-col gap-2">
                       <h3 className="text-xl font-black text-red-600 tracking-normal lowercase">Neural Rendering Failed</h3>
                       <p className="text-sm text-slate-400 font-bold max-w-md">
                         {nodes.render?.result?.error || "The synthesis matrix encountered a timeout or resource allocation error during final rendering."}
                       </p>
                    </div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="h-11 px-8 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95"
                    >
                      Retry Neural Sync
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 animate-pulse">
                      <Icons.Loader className="w-8 h-8 text-slate-300 animate-spin" />
                    </div>
                    <div className="flex flex-col gap-2">
                       <h3 className="text-xl font-black text-slate-600 tracking-normal lowercase">Rendering in Progress</h3>
                       <p className="text-sm text-slate-400 font-bold">The master video is currently being synthesized in the visual matrix.</p>
                    </div>
                  </>
                )}
              </div>
            )
          )}

            {/* Top Row: Visual Matrix & Node Intel */}
            <div className="grid grid-cols-12 gap-6 md:gap-10">
              {/* Assets Showcase */}
              <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-8 md:gap-10 overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-[18px] md:rounded-[20px] flex items-center justify-center border border-slate-100">
                    <Icons.Image className="w-5 h-5 md:w-6 md:h-6 text-brand-primary" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <h4 className="text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none truncate">visual assets_matrix</h4>
                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-300 mt-2 truncate">Neural Sequence</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {result.scene_images?.map((scene: any, idx: number) => (
                    <div
                      key={idx}
                      className="group bg-slate-50 rounded-[24px] md:rounded-[32px] overflow-hidden border border-slate-200/50 relative cursor-pointer"
                      onClick={() => {
                        setSelectedImage(normalizeAssetUrl(scene.image_url));
                        setIsPreviewOpen(true);
                      }}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={normalizeAssetUrl(scene.image_url)}
                          alt={`Scene ${scene.scene_id}`}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 md:p-8 flex flex-col justify-end">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Prompt_ID: {idx + 1}</span>
                          <p className="text-xs md:text-sm font-medium text-white/90 leading-relaxed italic line-clamp-4">
                            "{scene.prompt_used}"
                          </p>
                          <div className="flex justify-center mt-4">
                             <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md">
                               <Icons.Search className="w-4 h-4 text-white" />
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 md:p-6 bg-white border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">Scene_0{scene.scene_id}</span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-black uppercase rounded-lg border border-emerald-100">completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orchestration & Tracking Intel */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 md:gap-10">
                {/* Neural Thread */}
                <div className="bg-linear-to-br from-brand-primary to-brand-secondary rounded-[32px] md:rounded-[40px] p-8 md:p-10 text-white shadow-2xl shadow-brand-primary/10 relative overflow-hidden group">
                  <h4 className="text-lg md:text-xl font-black tracking-normal lowercase leading-none mb-8 md:mb-10 relative z-10 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    orchestration_thread
                  </h4>
                  <div className="flex flex-col gap-6 md:gap-8 relative z-10">
                    <div className="absolute left-[13.5px] top-6 bottom-6 w-px bg-white/10" />
                    {steps.map((step) => {
                      const status = getNodeStatus(step.id);
                      const isDone = status === "done";
                      const isRunning = status === "running";
                      const nodeData = nodes[step.id];
                      return (
                        <div key={step.id} className="flex gap-5 md:gap-6 group/node">
                          <div className="relative shrink-0">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-700 relative z-10 shadow-sm",
                              isDone ? "bg-white/10 text-white border border-white/20" :
                                isRunning ? "bg-white/20 text-white animate-pulse" :
                                  status === "failed" ? "bg-red-500/20 text-red-500 border border-red-500/20 shadow-xl shadow-red-200/10" :
                                    "bg-white/5 text-white/20 border border-white/5"
                            )}>
                              {isDone ? <Icons.Success className="w-4 h-4" /> :
                                isRunning ? <Icons.Loader className="w-4 h-4 animate-spin" /> :
                                  status === "failed" ? <Icons.Activity className="w-3.5 h-3.5" /> :
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />}
                            </div>
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className={cn(
                              "text-[13px] md:text-[14px] font-bold tracking-tight truncate transition-colors duration-500",
                              isDone ? "text-white" : 
                                isRunning ? "text-white/80" : 
                                  status === "failed" ? "text-red-400" :
                                    "text-white/30"
                            )}>
                              {step.label}
                            </span>
                            {status === "failed" && (
                              <span className="text-xs font-bold text-red-400 mt-0.5 truncate">
                                Error: {nodeData.result?.error || "Node synthesis failed"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Implementation Meta */}
                <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-8 md:gap-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-[18px] flex items-center justify-center border border-slate-100">
                      <Icons.PenLine className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h4 className="text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none truncate">intel_matrix</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 md:gap-y-6">
                    {[
                      { label: "Neural Model", value: brief.video_model || "Standard GPU Cluster" },
                      { label: "Platform Canvas", value: `${brief.platform || "Social"} | ${brief.format || campaign.format}` },
                      { label: "Brand Tone", value: brief.tone },
                      { label: "Campaign Mood", value: brief.mood },
                      { label: "Scene Count", value: `${brief.num_scenes || 0} Frames` },
                      { label: "Voice Profile", value: brief.voice },
                      { label: "Synthetics Speed", value: `${brief.voice_speed || 1.0}x` },
                      { label: "Transition Matrix", value: brief.transition },
                      { label: "Atmospheric Mix", value: `${Math.round((brief.music_volume || 0.1) * 100)}%` },
                    ].map((p, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <span className="text-xs md:text-xs font-black uppercase tracking-widest text-slate-300 pl-1">{p.label}</span>
                        <div className="p-4 md:p-5 bg-slate-50/50 rounded-2xl md:rounded-[24px] border border-slate-100/50">
                          <p className="text-xs md:text-sm font-bold text-[#121212] leading-tight line-clamp-2">{p.value || "Config Ready"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Style Directive */}
                {(result.style_prompt || brief.style_prompt) && (
                  <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-[18px] flex items-center justify-center border border-slate-100">
                        <Icons.MagicWand className="w-5 h-5 text-brand-primary" />
                      </div>
                      <h4 className="text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none">style_directive</h4>
                    </div>
                    <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100/50">
                       <p className="text-xs md:text-sm font-medium text-[#121212] leading-relaxed italic">
                         "{result.style_prompt || brief.style_prompt}"
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NEW: Narrative Synthesis Section */}
            {(fullScript || sceneScripts.length > 0) && (
              <div className="grid grid-cols-12 gap-6 md:gap-10">
                <div className="col-span-12 bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-[18px] md:rounded-[20px] flex items-center justify-center border border-slate-100">
                        <Icons.Mic className="w-5 h-5 md:w-6 md:h-6 text-brand-primary" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none">narrative_synthesis</h4>
                         <span className="text-xs font-black uppercase tracking-widest text-slate-300 mt-2">Script & Overlay Coordination</span>
                      </div>
                    </div>
                    {scriptObj.word_count && (
                      <div className="flex items-center gap-4">
                         <div className="flex flex-col items-end">
                            <span className="text-xs font-black uppercase text-slate-300">Word Count</span>
                            <span className="text-sm font-black text-brand-primary">{scriptObj.word_count} wds</span>
                         </div>
                         <div className="w-px h-8 bg-slate-100" />
                         <div className="flex flex-col items-end">
                            <span className="text-xs font-black uppercase text-slate-300">Duration</span>
                            <span className="text-sm font-black text-brand-primary">{scriptObj.estimated_duration_seconds}s</span>
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Full Script Text */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary pl-1">Master Script</span>
                       <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 h-full">
                          <p className="text-sm md:text-base font-medium text-[#121212] leading-relaxed italic">
                            "{fullScript}"
                          </p>
                       </div>
                    </div>

                    {/* Scene Breakdowns */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary pl-1">Scene Synchronization</span>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {sceneScripts.map((text: string, idx: number) => {
                             const overlay = overlays.find((o: any) => o.scene_id === idx + 1);
                             return (
                                <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[24px] flex flex-col gap-4 hover:border-slate-200 transition-all shadow-sm">
                                   <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                      <span className="text-xs font-black text-brand-primary uppercase">Scene_0{idx + 1}</span>
                                      <Icons.AudioWave className="w-3 h-3 text-blue-400 opacity-50" />
                                   </div>
                                   <div className="flex flex-col gap-3">
                                      <div>
                                         <span className="text-xs font-black uppercase text-slate-300 tracking-normal">Audio Stream</span>
                                         <p className="text-sm font-medium text-[#4F4F4F] leading-relaxed mt-1 italic">"{text}"</p>
                                      </div>
                                      {overlay && (
                                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                                            <span className="text-xs font-black uppercase text-blue-500 tracking-normal">Video Overlay</span>
                                            <p className="text-sm font-black text-brand-primary mt-1">{overlay.text}</p>
                                         </div>
                                      )}
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEW: Social Architecture Section */}
            {platformContent.caption && (
              <div className="grid grid-cols-12 gap-6 md:gap-10">
                <div className="col-span-12 bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-8">
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-[18px] md:rounded-[20px] flex items-center justify-center border border-slate-100">
                      <Icons.MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-brand-primary" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none">social_architecture</h4>
                       <span className="text-xs font-black uppercase tracking-widest text-brand-primary/40 mt-1">{platform} | Platform Fit Optimized</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="flex flex-col gap-4">
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary pl-1">Primary Platform Copy</span>
                       <div className="p-8 bg-slate-900 text-white rounded-[32px] border border-white/5 relative group">
                          <button 
                            onClick={() => {
                               navigator.clipboard.writeText(platformContent.caption);
                               toast.success("Platform copy synced to clipboard");
                            }}
                            className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                          >
                             <Icons.Files className="w-4 h-4 text-white" />
                          </button>
                          <p className="text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">
                            {platformContent.caption}
                          </p>
                          {platformContent.cta && (
                             <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-2">
                                <span className="text-xs font-black uppercase text-blue-400 tracking-widest">Call to Action</span>
                                <p className="text-sm font-black text-white">{platformContent.cta}</p>
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="flex flex-col gap-6">
                       <div className="flex flex-col gap-4">
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary pl-1">Neural Hashtag Clusters</span>
                          <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 flex flex-wrap gap-2">
                             {platformContent.hashtags?.map((tag: string, idx: number) => (
                                <span key={idx} className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold text-[#4F4F4F] transition-all hover:border-blue-400/30 hover:text-blue-500">
                                   {tag}
                                </span>
                             ))}
                          </div>
                       </div>
                       
                       <div className="mt-auto p-8 bg-emerald-50/50 rounded-[32px] border border-emerald-100/50 flex items-center gap-6">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                             <Icons.CheckCircle className="w-7 h-7 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-xs font-black uppercase text-emerald-600 tracking-widest">Platform Validation</span>
                             <p className="text-sm font-bold text-brand-primary mt-1">This dossier is fully compliant with the {platform} advertising matrix.</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Dimensions Grid */}
            <div className="grid grid-cols-12 gap-6 md:gap-10">
              {/* Metrics Breakdown */}
              <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-8 md:gap-10 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-[18px] md:rounded-[20px] flex items-center justify-center border border-slate-100">
                      <Icons.Success className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-base sm:text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none">dimension_breakdown</h4>
                       <span className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1 sm:mt-2">Weighted Audit Results</span>
                    </div>
                  </div>
                  <div className="flex items-center sm:items-end flex-row sm:flex-col justify-between sm:justify-start">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-brand-primary tracking-normal tabular-nums">{Math.round((quality.overall_score || 0) * 100)}%</span>
                  </div>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                   {quality.dimension_details && Object.entries(quality.dimension_details).map(([key, dim]: any) => (
                     <div key={key} className="p-6 md:p-8 bg-slate-50/50 rounded-[24px] md:rounded-[32px] border border-slate-100/50 flex flex-col gap-5 hover:bg-white hover:border-slate-200 transition-all">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                         <span className="text-xs font-black uppercase tracking-widest text-brand-primary">{key.replace('_', ' ')}</span>
                         <span className="text-xl md:text-2xl font-black text-brand-primary/40 tabular-nums">{Math.round((dim.score || 0) * 100)}%</span>
                       </div>

                       {/* Granular Audit Logs */}
                       <div className="flex flex-col gap-3">
                          {dim.issues && dim.issues.length > 0 && (
                             <div className="flex flex-col gap-2">
                                {dim.issues.map((issue: string, idx: number) => (
                                   <div key={idx} className="flex items-start gap-2 bg-red-50/50 p-2 rounded-lg border border-red-100/30">
                                      <Icons.Activity className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                                      <p className="text-[9px] md:text-[10px] font-bold text-red-600 leading-tight capitalize">{issue}</p>
                                   </div>
                                ))}
                             </div>
                          )}
                          {dim.notes && (
                             <div className="p-3 bg-white/60 rounded-xl border border-slate-100/50 italic">
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Note: {dim.notes}</p>
                             </div>
                          )}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>

              {/* Agent Audit Cluster */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 md:gap-10">
                <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-8 md:gap-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-[18px] flex items-center justify-center border border-slate-100">
                      <Icons.Shield className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h4 className="text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none">auditing_agents</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quality.evaluator_models?.map((model: string, idx: number) => (
                      <div key={idx} className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-900 text-white rounded-lg md:rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">
                        {model}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col gap-8 md:gap-10 grow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-[18px] flex items-center justify-center border border-slate-100">
                      <Icons.Rocket className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h4 className="text-lg md:text-xl font-black text-brand-primary tracking-normal lowercase leading-none truncate">master_assets</h4>
                  </div>
                  <div className="flex flex-col gap-4">
                    {result.video_url && <AssetLink label="Video Render" url={result.video_url} icon={Icons.Video} />}
                    {result.music_url && <AssetLink label="Ambient Score" url={result.music_url} icon={Icons.AudioWave} />}
                    {result.voiceover_url && <AssetLink label="Neural Voice" url={result.voiceover_url} icon={Icons.Mic} />}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <ImageViewerModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={selectedImage}
      />
    </DashboardLayout>
  );
}

function AssetLink({ label, url, icon: Icon }: any) {
  const normalizedUrl = normalizeAssetUrl(url);
  return (
    <a
      href={normalizedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="p-4 bg-slate-50/50 border border-slate-100/50 rounded-[18px] md:rounded-[20px] flex items-center justify-between group hover:bg-white hover:border-brand-primary/10 transition-all"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-slate-100 shrink-0 group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4 text-brand-primary" />
        </div>
        <span className="text-xs font-bold text-brand-primary lowercase truncate">{label}</span>
      </div>
      <Icons.ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-primary transition-colors shrink-0" />
    </a>
  );
}
