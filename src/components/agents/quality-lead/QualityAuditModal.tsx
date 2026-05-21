"use client";

import { Icons } from "@/components/ui/icons";
import { cn, normalizeAssetUrl } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import React, { useState, useEffect, useCallback, useRef } from "react";

interface QualityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  candidate: any;
}

export function QualityAuditModal({ isOpen, onClose, onRefresh, candidate }: QualityAuditModalProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<any>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://apiplatform.raver.ai/api";

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const fetchReportUpdates = useCallback(async (id: string) => {
    try {
      const response = await apiFetch(`${API_BASE}/ai/quality/report/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const report = data.data;
          setAuditReport(report);
          
          // Termination condition: If we have a decision or scores, stop polling
          if (report.decision || report.overallScore || report.metadata?.overall_score) {
            stopPolling();
            toast.success("Audit report fully synchronized.");
            if (onRefresh) onRefresh();
          } else {
            // Continue polling
            pollTimerRef.current = setTimeout(() => fetchReportUpdates(id), 3000);
          }
        }
      }
    } catch (err) {
      console.warn("Polling update failed:", err);
      stopPolling();
    }
  }, [API_BASE, stopPolling]);

  const { type, label, url, createdAt, id, sessionId, campaignId, raw } = candidate || {};

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    // State Isolation Logic: Reset report states when the modal is closed or candidate changes
    if (!isOpen) {
      stopPolling();
      setAuditReport(null);
      setReportId(null);
      setIsAuditing(false);
    }
  }, [isOpen, id, stopPolling]);

  useEffect(() => {
    // Proactive synchronization of pre-existing reports from metadata
    if (isOpen && raw) {
      const existingReport = raw?.result?.quality_report || 
                            raw?.metadata?.production?.quality_report ||
                            raw?.result?.nodes?.score_quality?.result ||
                            raw?.quality_report; // Backend joint-enriched report
      
      if (existingReport && (existingReport.decision || existingReport.overallScore || existingReport.metadata?.overall_score)) {
        setAuditReport(existingReport);
      }
    }
  }, [isOpen, raw]);

  if (!isOpen || !candidate) return null;
  
  // High-res fallback extraction for Producer/Director videos
  const finalUrl = url || 
    raw?.mixUrl || raw?.musicUrl || raw?.voiceoverUrl || raw?.mainImageUrl ||
    raw?.result?.video_url || raw?.result?.videoUrl || raw?.result?.render_url || 
    raw?.result?.result?.video_url || raw?.result?.nodes?.render?.result?.video_url ||
    raw?.metadata?.video_url || raw?.metadata?.videoUrl || 
    raw?.metadata?.production?.video_url || raw?.metadata?.production?.videoUrl ||
    raw?.metadata?.render_details?.video_url ||
    raw?.config?.result?.video_url || raw?.config?.result?.videoUrl ||
    raw?.config?.nodes?.render?.result?.video_url || raw?.config?.nodes?.render?.result?.videoUrl ||
    raw?.videoSynthesis?.[0]?.url || raw?.result?.results?.[0]?.video_url ||
    raw?.scenes?.[0]?.url;
    
  const normalizedUrl = finalUrl ? normalizeAssetUrl(finalUrl) : null;

  const handleInitiateEvaluation = async () => {
    setIsAuditing(true);
    try {
      // Data Mapping Layer
      const payload = {
        campaign_id: campaignId || "manual_audit",
        session_id: sessionId || "manual_session",
        brief: raw?.metadata?.payload?.brief || raw?.brief || raw?.metadata?.brief || {},
        scene_images: (type === 'Image' || type === 'image_scenes') && !(raw?.scenes?.length > 0)
          ? [{ url: normalizeAssetUrl(finalUrl) }] 
          : (raw?.scenes || raw?.metadata?.payload?.scenes || []).map((s: any) => ({ ...s, url: normalizeAssetUrl(s.url || s.image_url) })),
        script: (typeof raw?.script === 'object' && raw.script !== null ? raw.script.script : (raw?.script || raw?.content || raw?.metadata?.payload?.script || "No script provided")),
        overlays: raw?.metadata?.payload?.overlays || raw?.overlays || [],
        voiceover_url: normalizeAssetUrl(raw?.voiceoverUrl || raw?.metadata?.payload?.voiceover_url || raw?.metadata?.production?.voiceover_url || raw?.metadata?.voiceover_url),
        music_url: normalizeAssetUrl(raw?.musicUrl || raw?.metadata?.payload?.music_url || raw?.metadata?.production?.music_url || raw?.metadata?.music_url || (type === 'Audio' ? finalUrl : null)),
        video_url: normalizeAssetUrl(['Editor', 'Producer', 'Director', 'video_synthesis', 'producer_render', 'director_session', 'Director', 'Producer'].includes(type) ? finalUrl : null)
      };

      const response = await apiFetch(`${API_BASE}/ai/quality/score`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const initialReport = data.data;
          setAuditReport(initialReport);
          const rid = initialReport.id || initialReport.reportId;
          setReportId(rid);

          // If the report is not immediate, start polling
          if (!initialReport.decision && !initialReport.overallScore && rid) {
            setIsPolling(true);
            toast.info("Audit initiated. Synchronizing neural report...");
            fetchReportUpdates(rid);
          } else {
            toast.success("Neural evaluation complete. Quality report synchronized.");
            if (onRefresh) onRefresh();
          }
        }
      } else {
        toast.error("Evaluation failed. The neural engine returned an error.");
      }
    } catch (err) {
      console.error("Audit failed:", err);
      toast.error("Orchestration pipeline failure during evaluation.");
    } finally {
      setIsAuditing(false);
    }
  };

  const renderMediaContent = () => {
    switch (type) {
      case "Editor":
      case "Producer":
      case "Director":
      case "video_synthesis":
      case "producer_render":
      case "director_session":
        return normalizedUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black rounded-3xl overflow-hidden shadow-2xl">
            <video 
              src={normalizedUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center">
            <Icons.Video className="w-12 h-12 text-slate-200" />
          </div>
        );

      case "Audio":
      case "audio_mix":
        return (
          <div className="w-full h-full bg-linear-to-br from-brand-primary to-brand-secondary rounded-3xl flex flex-col items-center justify-center p-12 gap-8 shadow-2xl">
             <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
               <Icons.Mic className="w-10 h-10 text-white/40" />
             </div>
             {normalizedUrl && (
               <audio src={normalizedUrl} controls className="w-full max-w-md invert opacity-80" />
             )}
             <div className="flex gap-1 items-center h-20 w-full max-w-md">
               {Array.from({ length: 40 }).map((_, i) => (
                 <div 
                   key={i} 
                   className="flex-1 bg-white/20 rounded-full animate-pulse" 
                   style={{ 
                     height: `${20 + Math.random() * 80}%`,
                     animationDelay: `${i * 50}ms`
                   }} 
                 />
               ))}
             </div>
          </div>
        );

      case "Image":
      case "image_scenes":
        return normalizedUrl ? (
          <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white flex items-center justify-center p-2 border border-slate-100">
            <img 
              src={normalizedUrl} 
              alt={label}
              className="w-full h-full object-contain rounded-2xl" 
            />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center">
            <Icons.Image className="w-12 h-12 text-slate-200" />
          </div>
        );

      case "Copy":
      case "copy_script":
        const scriptText = (typeof raw?.script === 'object' && raw.script !== null ? raw.script.script : (raw?.script || raw?.content)) 
        || "No script content available for this candidate.";
        
        return (
          <div className="w-full h-full bg-white rounded-3xl p-12 overflow-y-auto custom-scrollbar border border-slate-100 shadow-2xl">
             <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Icons.Files className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-primary tracking-normal">Candidate Ad Script</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Linguistic Output v1.5</p>
                  </div>
                </div>
                <div className="h-px bg-slate-50 w-full" />
                <p className="text-[18px] font-medium text-slate-600 leading-relaxed italic text-center p-8 bg-slate-50/50 rounded-[32px] border border-slate-100">
                  {scriptText}
                </p>
             </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center">
            <Icons.Activity className="w-12 h-12 text-slate-200" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-primary/40 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-[#F8FAFC] rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 bg-white border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-xl shadow-brand-primary/20">
              <Icons.ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-brand-primary tracking-normal lowercase leading-tight">{label}</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Archival Audit Mode</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 leading-none">Integrity Verified</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-slate-100 transition-all active:scale-95 group shadow-sm"
          >
            <Icons.Plus className="w-6 h-6 rotate-45 group-hover:rotate-135 transition-transform duration-500" />
          </button>
        </div>

        {/* Audit Dashboard */}
        <div className="flex-1 flex overflow-hidden">
          {/* Media Inspection Engine */}
          <div className="flex-1 p-10 overflow-hidden bg-slate-50/50">
             <div className="w-full h-full relative group">
                {renderMediaContent()}
                
                {/* Information Overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur-md rounded-[32px] border border-white shadow-2xl transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-between pointer-events-none">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center">
                         <Icons.Activity className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[11px] font-black text-brand-primary uppercase tracking-normal">Candidate Integrity Analysis</span>
                         <span className="text-[10px] text-slate-400 font-bold">Neural weight distribution matches branch signature.</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-xl font-black text-brand-primary">
                        {(() => {
                          const score = auditReport?.overallScore || auditReport?.overall_score || auditReport?.metadata?.overall_score;
                          return score ? `${(score * 100).toFixed(1)}%` : "Pending";
                        })()}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confidence Score</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Technical Inventory Sidebar */}
          <div className="w-[400px] border-l border-slate-100 bg-white flex flex-col overflow-hidden">
             <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Orchestration Parameters */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <Icons.Settings className="w-4 h-4 text-blue-500" />
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Technical Inventory</h3>
                   </div>
                   
                   <div className="space-y-2">
                      {[
                        { label: "Neural ID", value: (auditReport?.reportId || auditReport?.id || id || "").slice(0, 16) + "...", mono: true },
                        { label: "Session Archival", value: sessionId || "Global Vault", mono: true },
                        { label: "Campaign Sync", value: campaignId || "Unlinked", mono: true },
                        { label: "Synthesis Date", value: createdAt ? new Date(createdAt).toLocaleString() : "Recently" },
                        { label: "Candidate Type", value: (type || "Unknown").replace("_", " "), bold: true }
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
                           <span className={cn(
                             "text-[12px] font-bold text-brand-primary",
                             item.mono && "font-mono text-[10px]",
                             item.bold && "font-black"
                           )}>
                             {item.value}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Neural Foundations Section */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Neural Foundations</h4>
                      <Icons.Database className="w-3.5 h-3.5 text-blue-500" />
                   </div>
                   
                   <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                      {(raw?.scenes || raw?.metadata?.payload?.scenes || []).map((scene: any, i: number) => {
                        const sceneImg = scene.url || scene.image_url;
                        return (
                          <div key={i} className="min-w-[120px] flex flex-col gap-2">
                             <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden group/scene relative">
                                {sceneImg ? (
                                  <img 
                                     src={normalizeAssetUrl(sceneImg)} 
                                     className="w-full h-full object-cover transition-transform duration-500 group-hover/scene:scale-110 cursor-pointer" 
                                     alt={`Scene ${i+1}`}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                     <Icons.Image className="w-5 h-5 text-slate-200" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase">
                                  S{i+1}
                                </div>
                             </div>
                             <p className="text-[9px] font-medium text-slate-400 truncate px-1">
                               {scene.visual_prompt || scene.prompt_used || "Neural frame foundation..."}
                             </p>
                          </div>
                        );
                      })}
                      {(raw?.scenes || raw?.metadata?.payload?.scenes || []).length === 0 && (
                        <div className="w-full py-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-100 rounded-3xl">
                           <Icons.Activity className="w-5 h-5 text-slate-200" />
                           <span className="text-[9px] font-black uppercase text-slate-300">No scene foundations cached</span>
                        </div>
                      )}
                   </div>
                </div>

                {/* Audit Actions / Results */}
                <div className="pt-4 space-y-4">
                   {!auditReport ? (
                     <div className="p-5 bg-blue-50/50 rounded-[28px] border border-blue-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                           <Icons.MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[11px] font-medium text-blue-800 leading-tight">
                          Platform-ready candidate. Neural alignment is standby.
                        </p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <Icons.ShieldCheck className="w-4 h-4 text-emerald-500" />
                           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Neural Report v1.0</h3>
                        </div>
                         <div className="space-y-6">
                            {/* Dashboard of scores */}
                            <div className="grid grid-cols-2 gap-3">
                               {[
                                 { label: "Visual", value: auditReport.visualScore || auditReport.metadata?.visual_score, color: "text-blue-500" },
                                 { label: "Brand", value: auditReport.brandAlignmentScore || auditReport.metadata?.brand_alignment_score, color: "text-emerald-500" },
                                 { label: "Copy", value: auditReport.copyScore || auditReport.metadata?.copy_score, color: "text-purple-500" },
                                 { label: "Audio", value: auditReport.audioFitScore || auditReport.metadata?.audio_fit_score, color: "text-amber-500" }
                               ].map((score, i) => (
                                 <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{score.label}</span>
                                    <div className={cn("text-sm font-black", score.color)}>{score.value ? (score.value * 10).toFixed(1) : "0.0"}/10</div>
                                 </div>
                               ))}
                            </div>

                            {/* Evaluator Stack */}
                            {auditReport.metadata?.evaluator_models && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Icons.Layers className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Collaborative Evaluator Stack</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {auditReport.metadata.evaluator_models.map((model: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-lg text-[9px] font-bold text-brand-primary lowercase tracking-tight">
                                      {model}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Detailed Diagnostics */}
                            {(auditReport.metadata?.dimension_details || auditReport.dimension_details) && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <Icons.Activity className="w-3 h-3 text-slate-400" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Neural Diagnostic Drilldown</span>
                                </div>
                                <div className="space-y-2">
                                  {Object.entries((auditReport.metadata?.dimension_details || auditReport.dimension_details)).map(([key, details]: [string, any]) => {
                                    if (!details?.issues?.length && !details?.notes) return null;
                                    return (
                                      <div key={key} className="p-5 bg-slate-50/50 rounded-[28px] border border-slate-100 space-y-3 relative overflow-hidden group/dim">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/10 group-hover/dim:bg-blue-500 transition-colors" />
                                        <div className="flex items-center justify-between">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">{key.replace("_", " ")}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Weight: {Math.round((details.weight || 0) * 100)}%</span>
                                              <span className="w-1 h-1 rounded-full bg-slate-200" />
                                              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Contribution: {(details.weighted_score || 0).toFixed(3)}</span>
                                            </div>
                                          </div>
                                          <div className={cn(
                                            "w-10 h-10 rounded-xl flex flex-col items-center justify-center border",
                                            details.score < 0.4 ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-emerald-50 border-emerald-100 text-emerald-500"
                                          )}>
                                            <span className="text-[12px] font-black leading-none">{details.score.toFixed(2)}</span>
                                            <span className="text-[7px] font-black uppercase mt-0.5">Score</span>
                                          </div>
                                        </div>
                                        
                                        {details.issues?.length > 0 && (
                                          <div className="space-y-1.5 pl-1">
                                            {details.issues.map((issue: string, idx: number) => (
                                              <div key={idx} className="flex gap-2.5 text-[10px] font-medium text-slate-500 leading-tight">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                                                {issue}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {details.notes && (
                                          <div className="mt-3 p-3 bg-white/50 rounded-xl border border-slate-100/50">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Expert Forensics</span>
                                            <p className="text-[10px] font-bold text-brand-primary/60 italic leading-relaxed">
                                              {details.notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className={cn(
                              "p-5 rounded-[28px] border",
                              (auditReport.decision === "auto_reject" || auditReport.rejected) 
                                ? "bg-rose-50/50 border-rose-100" 
                                : "bg-emerald-50/50 border-emerald-100"
                            )}>
                               <div className="flex items-center justify-between mb-4">
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-[9px] font-black uppercase tracking-[0.2em]",
                                      (auditReport.decision === "auto_reject" || auditReport.rejected) ? "text-rose-600" : "text-emerald-600"
                                    )}>
                                      Orchestration Verdict
                                    </span>
                                    {auditReport.metadata?.evaluation_duration_ms && (
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Analysis Latency: {auditReport.metadata.evaluation_duration_ms}ms
                                      </span>
                                    )}
                                  </div>
                                  <div className={cn(
                                    "px-4 py-1.5 text-white rounded-full text-[10px] font-black uppercase tracking-widest leading-none shadow-lg",
                                    (auditReport.decision === "auto_reject" || auditReport.rejected) ? "bg-rose-500 shadow-rose-500/20" : "bg-emerald-500 shadow-emerald-500/20"
                                  )}>
                                     {auditReport.decision?.replace("_", " ") || "Approved"}
                                  </div>
                               </div>
                               <p className={cn(
                                 "text-[10px] font-medium leading-tight italic",
                                 (auditReport.decision === "auto_reject" || auditReport.rejected) ? "text-rose-800" : "text-emerald-800"
                               )}>
                                 "{auditReport.rejectReason || auditReport.metadata?.reject_reason || "Candidate exceeds all brand alignment thresholds and is cleared for production."}"
                               </p>
                            </div>
                         </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Footer Action Tray */}
             <div className="p-8 border-t border-slate-50 bg-slate-50/50">
                {!auditReport ? (
                  <button 
                    onClick={handleInitiateEvaluation}
                    disabled={isAuditing || isPolling}
                    className={cn(
                      "w-full h-14 bg-brand-primary text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-3",
                      (isAuditing || isPolling) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"
                    )}
                  >
                    {isAuditing || isPolling ? (
                      <>
                        <Icons.Loader className="w-4 h-4 animate-spin" />
                        {isPolling ? "Synchronizing Neural Report..." : "Neural Pulse Analysis..."}
                      </>
                    ) : (
                      <>
                        <Icons.Zap className="w-4 h-4 text-amber-400" />
                        Initiate Neural Evaluation
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    {isPolling && (
                      <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                            <Icons.Loader className="w-3 h-3 text-amber-500 animate-spin" />
                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Active Syncing...</span>
                         </div>
                         <button 
                           onClick={() => reportId && fetchReportUpdates(reportId)}
                           className="p-1 px-2 bg-amber-100 rounded text-[8px] font-black text-amber-700 uppercase"
                         >
                           Force Refresh
                         </button>
                      </div>
                    )}
                    <button 
                      onClick={onClose}
                      className="w-full h-14 bg-slate-100 text-brand-primary rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Close Audit Report
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
