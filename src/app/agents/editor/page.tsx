"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { EditorModal } from "@/components/agents/editor/EditorModal";
import { EditorVault } from "@/components/agents/editor/EditorVault";
import { EditorResultModal } from "@/components/agents/editor/EditorResultModal";
import { apiFetch } from "@/lib/api";
import { cn, normalizeAssetUrl } from "@/lib/utils";
import { toast } from "react-toastify";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

function EditorContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string>(() => searchParams.get("session_id") || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);
  const [isResultDeleteModalOpen, setIsResultDeleteModalOpen] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://apiplatform.raver.ai/api";

  const fetchVault = async (sid?: string) => {
    setIsSyncing(true);
    try {
      // Switch to the dedicated editor results endpoint
      let endpoint = `${API_BASE}/ai/editor/results`;
      if (sid) {
        endpoint += `?sessionId=${sid}`;
      }

      const response = await apiFetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const videoAssets = data.data.map((c: any) => {
            const normalizedUrl = normalizeAssetUrl(c.videoUrl);
            return {
              id: c.id,
              url: normalizedUrl,
              // Derive thumbnail from video URL by replacing extension
              thumbnail: normalizedUrl.replace(/\.(mp4|mov|webm)$/i, '.jpg'),
              format: c.format || "16:9",
              timestamp: c.createdAt,
              status: c.metadata?.status || "completed",
              // Create a more descriptive label
              label: `Synthesis_${c.format}_${new Date(c.createdAt).toLocaleDateString()}`,
              sessionId: c.sessionId,
              metadata: c.metadata,
              videoUrl: c.videoUrl, // Keep original for modal
              createdAt: c.createdAt, // Keep original for modal
              type: c.type // 'render' or 'export'
            };
          });
          setVideos(videoAssets);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch editor vault:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchVault(sessionId);
  }, [sessionId]);

  // Handle auto-opening via search params
  useEffect(() => {
    if (searchParams.get("generate") === "true") {
      setIsModalOpen(true);
      const newUrl = window.location.pathname + (sessionId ? `?session_id=${sessionId}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, sessionId]);

  const pollRenderStatus = async (renderId: string) => {
    const pollInterval = 3000; // 3 seconds
    let attempts = 0;
    const maxAttempts = 100; // ~5 minutes timeout

    const checkStatus = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/ai/editor/renders/${renderId}`);
        if (response.ok) {
          const data = await response.json();
          const status = data.status || data.data?.status;

          if (status === "completed" || status === "success") {
            toast.success("Video synthesis complete!");
            fetchVault(sessionId);
            setIsGenerating(false);
            return;
          } else if (status === "failed" || status === "error") {
            toast.error("Video synthesis failed.");
            setIsGenerating(false);
            return;
          }

          // Continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, pollInterval);
          } else {
            toast.error("Synthesis timeout.");
            setIsGenerating(false);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
        setIsGenerating(false);
      }
    };

    checkStatus();
  };

  const handleGenerate = async (data: any) => {
    setIsGenerating(true);
    setIsModalOpen(false);
    toast.info("Initializing neural video synthesis pipeline...");
    
    try {
      const mode = data.mode; // 'render' or 'export'
      const endpoint = mode === "export" ? `${API_BASE}/ai/editor/export` : `${API_BASE}/ai/editor/render`;

      // Construct the final payload matching user requirements
      const payload = {
        ...data,
        session_id: sessionId,
      };

      // Remove frontend-only helper fields if any
      delete payload.mode;

      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const renderId = result.render_id || result.data?.render_id || result.id || result.data?.id;

        if (renderId) {
          toast.success("Synthesis job submitted. Rendering...");
          pollRenderStatus(renderId);
        } else {
          // If no renderId, maybe it finished instantly or it's a different response format
          toast.success("Synthesis request accepted.");
          fetchVault(sessionId);
          setIsGenerating(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to initiate synthesis");
      }
    } catch (err: any) {
      toast.error(err.message || "Orchestration pipeline failure. Please retry.");
      setIsGenerating(false);
    }
  };

  const handlePreview = (video: any) => {
    setSelectedVideo(video);
    setIsPreviewOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;
    setIsDeleting(true);
    try {
      await apiFetch(`${API_BASE}/ai/producer/session/${sessionId}`, { method: 'DELETE' });
      setSessionId("");
      fetchVault();
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error("Failed to archive session.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteResult = async () => {
    if (!resultToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiFetch(`${API_BASE}/ai/editor/results/${resultToDelete}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Synthesis result archived successfully.");
        fetchVault(sessionId);
        setIsResultDeleteModalOpen(false);
        setResultToDelete(null);
      } else {
        throw new Error("Failed to delete result");
      }
    } catch (err) {
      toast.error("Orchestration archive failure.");
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = [
    { label: "Total Renders", value: videos.length, icon: Icons.Film, color: "text-blue-500" },
    { label: "Processing", value: videos.filter(v => v.status === "processing").length, icon: Icons.Activity, color: "text-emerald-500" },
    { label: "Vault Storage", value: `${(videos.length * 4.2).toFixed(1)}GB`, icon: Icons.Dashboard, color: "text-purple-500" }
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 mx-auto bg-white rounded-3xl min-h-screen">
      {/* Standardized Orchestration Header */}
      <div className="flex flex-col gap-6 p-5 sm:p-8 relative overflow-hidden ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/agents" 
              className="w-10 h-10 rounded-[14px] bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 group shadow-sm"
            >
              <Icons.ArrowLeft className="w-5 h-5 text-brand-primary group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div className="flex flex-col">
               <h1 className="text-[28px] sm:text-[34px] font-black text-brand-primary tracking-normal lowercase leading-none">RAVER EDITOR</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3">High-Fidelity Cinematic Orchestration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {sessionId && (
              <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 bg-white rounded-[18px] border border-slate-100 shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-normal">Active Sync Session</span>
                    <span className="text-[10px] font-black text-brand-primary font-mono">{sessionId}</span>
                 </div>
                 <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="ml-2 p-1.5 hover:bg-red-50 rounded-lg transition-all text-slate-300 hover:text-red-500"
                 >
                   <Icons.Trash className="w-3.5 h-3.5" />
                 </button>
              </div>
            )}
            
            <button 
              onClick={() => !isGenerating && setIsModalOpen(true)}
              disabled={isGenerating}
              className={cn(
                "h-14 px-8 rounded-[20px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-brand-primary/10 border border-white/5",
                isGenerating 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-linear-to-r from-brand-primary to-brand-secondary text-white hover:scale-[1.02] active:scale-95"
              )}
            >
              {isGenerating ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin text-blue-500" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Icons.Rocket className="w-4 h-4" />
                  Initiate Synthesis
                </>
              )}
            </button>
          </div>
        </div>
      </div>  

      <div className="h-px bg-slate-50 w-full" />

      {/* Production Vault */}
      <div className="space-y-6 flex-1">
        <div className="bg-white rounded-[40px] p-2 border border-slate-50">
          <EditorVault 
            videos={videos} 
            isLoading={isSyncing} 
            onPreview={handlePreview} 
            onDelete={(id) => {
              setResultToDelete(id);
              setIsResultDeleteModalOpen(true);
            }}
            isGlobalArchive={!sessionId}
          />
        </div>
      </div>

      {/* Synthesis Modal */}
      <EditorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
      />

      {/* Preview Modal */}
      <EditorResultModal 
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedVideo(null);
        }}
        result={selectedVideo as any}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSession}
        title="Archive Synthesis Session"
        message="Are you sure you want to permanently archive this neural synthesis session? This will clear the active workspace while preserving assets in the global vault."
        confirmText="Archive Session"
        isLoading={isDeleting}
      />

      <ConfirmationModal 
        isOpen={isResultDeleteModalOpen}
        onClose={() => {
          setIsResultDeleteModalOpen(false);
          setResultToDelete(null);
        }}
        onConfirm={handleDeleteResult}
        title="Archive Synthesis Result"
        message="Are you sure you want to permanently archive this specific video render? This action cannot be undone within the active vault."
        confirmText="Archive Render"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <RaverLoadingState 
            title="Calibrating Visual Synthesis" 
            description="Accessing neural video archives and synchronizing the cinematic orchestration engine..." 
          />
        </div>
      }>
        <EditorContent />
      </Suspense>
    </DashboardLayout>
  );
}
