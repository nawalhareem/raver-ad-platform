"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";

import { CopyLeadModal } from "@/components/agents/copy-lead/CopyLeadModal";
import { CopyVault, CopyAsset } from "@/components/agents/copy-lead/CopyVault";
import ConfirmationModal from "@/components/ui/ConfirmationModal";


function CopyLeadContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string>(() => 
    searchParams.get("session_id") || ""
  );
  const [vault, setVault] = useState<CopyAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://apiplatform.raver.ai/api";

  const fetchGlobalVault = async () => {
    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE}/ai/copy-lead/results`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const mappedAssets: CopyAsset[] = data.data.map((item: any) => {
            const assetType = item.type || "package";
            
            // Map content based on type
            let content: any = null;
            if (assetType === "package") {
              content = {
                script: item.script,
                overlays: item.overlays,
                platform_copy: item.captions
              };
            } else if (assetType === "script") {
              content = item.script;
            } else if (assetType === "captions") {
              content = item.captions;
            } else if (assetType === "overlays") {
              content = item.overlays?.overlays || item.overlays;
            } else if (assetType === "hashtags") {
              content = item.hashtags?.hashtags || item.hashtags;
            } else if (assetType === "cta") {
              content = item.cta;
            }

            return {
              id: item.id,
              type: assetType === "produce" ? "package" : assetType,
              session_id: item.sessionId || item.campaignId,
              business_name: item.businessName || item.metadata?.brief?.business_name,
              platform: item.captions?.platform || item.hashtags?.platform || item.cta?.platform || item.metadata?.platform,
              timestamp: item.createdAt,
              content: content
            };
          }).filter(Boolean);

          setVault(mappedAssets);
        }
      }
    } catch (err) {
      console.warn("Global results failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchGlobalVault();
  }, [searchParams]);

  // Handle auto-open modal for generation
  useEffect(() => {
    if (searchParams.get("generate") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Always show the full history as requested (do not filter out or 'remove' results)
  const filteredVault = vault;

  const handleGenerate = async (type: string, data: any) => {
    setIsLoading(true);
    const sid = sessionId || `raver_copy_${new Date().getTime()}`;
    if (!sessionId) setSessionId(sid);
    
    // API Mapping & Payload Transformation
    let endpoint = type;
    if (type === "package") endpoint = "produce";
    if (type === "caption") endpoint = "captions";

    const payload: any = {
      session_id: sid,
      brief: {
        business_name: data.businessName,
        product_description: data.product,
        target_audience: data.audience,
        scenes: data.scenes
      },
      tone: data.tone
    };

    // Specific field mappings based on endpoint
    if (endpoint === "produce" || endpoint === "script") {
      // Data duration is now provided per-scene from the UI
      payload.duration_per_scene = parseInt(data.duration);
    }
    if (endpoint === "captions" || endpoint === "cta" || endpoint === "hashtags") {
      payload.platform = data.platform;
    }
    if (endpoint === "captions") {
      payload.campaign_context = data.context;
    }
    if (endpoint === "hashtags") {
      payload.count = parseInt(data.hashtagCount);
    }
    
    try {
      const response = await apiFetch(`${API_BASE}/ai/copy-lead/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Neural synthesis complete. Copy added to vault.");
        fetchGlobalVault();
      } else {
        toast.error("Neural synthesis failed. Please check your parameters.");
      }
    } catch (err) {
      toast.error("Connection error. Synthesis aborted.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const handleDeleteSession = (sid: string) => {
    setDeleteTargetId(sid);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    setIsDeleting(true);
    try {
      const res = await apiFetch(`${API_BASE}/ai/copy-lead/session/${deleteTargetId}`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        if (deleteTargetId === sessionId) {
          setSessionId("");
        }
        await fetchGlobalVault();
        setIsDeleteModalOpen(false);
        toast.success("Synthesis archived successfully");
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 mx-auto bg-white rounded-3xl min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 p-4 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link 
                href="/agents" 
                className="w-10 h-10 shrink-0 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90 group"
              >
                <Icons.ArrowLeft className="w-5 h-5 text-brand-primary group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <div className="flex flex-col">
                 <h1 className="text-[24px] sm:text-[34px] font-black text-brand-primary tracking-normal lowercase leading-none">raver ai copy lead</h1>
                 <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 sm:mt-3">Creative Orchestration Studio</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
               {sessionId && (
                <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-50 rounded-[18px] border border-slate-100/50">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                   <div className="flex flex-col min-w-0">
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-normal truncate">Syncing Session</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-brand-primary font-mono truncate max-w-[120px] sm:max-w-none">{sessionId}</span>
                   </div>
                   <button 
                    onClick={() => handleDeleteSession(sessionId)}
                    className="ml-auto p-1.5 hover:bg-white rounded-lg transition-all text-slate-300 hover:text-red-500"
                   >
                     <Icons.Trash className="w-3 link-3 sm:w-3.5 sm:h-3.5" />
                   </button>
                </div>
              )}
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="h-12 sm:h-14 px-6 sm:px-8 bg-linear-to-r from-brand-primary to-brand-secondary  text-white rounded-[18px] sm:rounded-[20px] font-black text-[10px] sm:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-primary/10 border border-white/5 flex-1 sm:flex-none"
              >
                <Icons.whiteMagicWand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Initiate Synthesis</span>
              </button>
            </div>
          </div>
        </div>

        {/* Neural Vault Section */}
        <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.01)] h-full">
           <CopyVault 
             assets={filteredVault}
             isLoading={isSyncing}
             onCopy={handleCopy}
             isGlobalArchive={true}
             onDelete={handleDeleteSession}
           />
        </div>

        {/* Neural Orchestration Modal */}
        <CopyLeadModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />

        <ConfirmationModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Archive Synthesis"
          message="Are you sure you want to permanently archive this neural linguistic synthesis? This action cannot be undone."
          confirmText="Archive"
          isLoading={isDeleting}
        />

      </div>
    </DashboardLayout>
  );
}

export default function CopyLeadPage() {
  return (
    <Suspense fallback={
       <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center p-8 bg-white rounded-3xl">
             <RaverLoadingState 
               title="Calibrating Neural Linguistics" 
               description="Preparing the creative engine and synchronizing your synthesis vault..." 
             />
          </div>
       </DashboardLayout>
    }>
      <CopyLeadContent />
    </Suspense>
  );
}
