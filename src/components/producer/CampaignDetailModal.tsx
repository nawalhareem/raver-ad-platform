"use client";

import React from "react";
import { Icons } from "@/components/ui/icons";
import { cn, normalizeAssetUrl } from "@/lib/utils";

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: any;
}

export function CampaignDetailModal({ isOpen, onClose, campaign }: CampaignDetailModalProps) {
  if (!isOpen || !campaign) return null;

  const brief = campaign.config?.brief || campaign.brief || {};
  const nodes = campaign.config?.nodes || {};
  const result = campaign.config?.result || {};
  const quality = result.quality_report || {};

  const getNodeStatus = (nodeKey: string) => {
    const node = nodes[nodeKey];
    if (!node) return "pending";
    if (node.status === "completed" || node.status === "success") return "done";
    if (node.status === "running" || node.status === "processing" || node.status === "started") return "running";
    if (node.status === "failed" || node.error) return "failed";
    return "pending";
  };

  const steps = [
    { id: "generate_text", label: "Narrative Synthesis", icon: Icons.Mic },
    { id: "generate_image", label: "Visual Matrix", icon: Icons.Image },
    { id: "generate_voice", label: "Neural Voice", icon: Icons.AudioWave },
    { id: "generate_music", label: "Atmospheric Score", icon: Icons.AudioWave },
    { id: "render", label: "Neural Rendering", icon: Icons.Video },
    { id: "score_quality", label: "Quality Audit", icon: Icons.Success },
  ];

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#01012A]/60 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" 
      />
      
      {/* Modal Container */}
      <div 
        className="relative bg-white w-full max-w-[1400px] h-full max-h-[95vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-700"
      >
        {/* Header Section */}
        <div className="px-12 pt-12 pb-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md relative z-20">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px]  flex items-center justify-center shadow-2xl shadow-brand-primary/20">
                 <Icons.Activity className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-3">
                   <h3 className="text-4xl font-black text-brand-primary tracking-normal lowercase leading-none">
                     {campaign.name || "unnamed_production"}
                   </h3>
                   <div className={cn(
                     "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                     campaign.status === "delivered" || campaign.status === "ready_for_human_review" || campaign.status === "completed"
                       ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" 
                       : "bg-slate-50 text-slate-500 border-slate-100"
                   )}>
                     {campaign.status}
                   </div>
                 </div>
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                   <span className="flex items-center gap-1.5">
                     <Icons.Files className="w-3 h-3" />
                     ID: {campaign.id}
                   </span>
                   <span className="w-1 h-1 rounded-full bg-slate-200" />
                   <span className="flex items-center gap-1.5">
                     <Icons.Activity className="w-3 h-3" />
                     Thread Active: {new Date(campaign.createdAt || campaign.created_at).toLocaleString()}
                   </span>
                 </div>
              </div>
           </div>
           
           <button 
             onClick={onClose}
             className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group active:scale-90"
           >
              <Icons.Plus className="w-7 h-7 text-slate-400 group-hover:text-brand-primary rotate-45 transition-transform" />
           </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-slate-50 p-12">
          <div className="max-w-[1240px] mx-auto grid grid-cols-12 gap-10">
            
            {/* Left Column: Visuals & Metrics */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
              
              {/* Asset Showcase */}
              <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                       <Icons.Image className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                       <h4 className="text-lg font-black text-brand-primary tracking-normal lowercase leading-none">visual assets_matrix</h4>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1.5">AI Generated Sequence</span>
                    </div>
                  </div>
                  {result.video_url && (
                    <a 
                      href={normalizeAssetUrl(result.video_url)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-10 px-6 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/10"
                    >
                      <Icons.Video className="w-3.5 h-3.5" />
                      View High-Res Master
                    </a>
                  )}
                </div>

                {/* Scene Images Scroll */}
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-horizontal px-1">
                  {result.scene_images?.map((scene: any, idx: number) => (
                    <div 
                      key={idx}
                      className="shrink-0 w-[280px] aspect-square rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50 group/img relative"
                    >
                      <img 
                        src={normalizeAssetUrl(scene.image_url)} 
                        alt={`Scene ${scene.scene_id}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col justify-end p-6">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Scene {scene.scene_id}</span>
                        <p className="text-[11px] font-medium text-white line-clamp-2 mt-1 leading-relaxed">
                          {scene.prompt_used}
                        </p>
                      </div>
                      <div className="absolute top-4 left-4 h-8 px-3 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center">
                         <span className="text-[10px] font-black text-white">#{scene.scene_id}</span>
                      </div>
                    </div>
                  ))}
                  {!result.scene_images && (
                    <div className="w-full h-[280px] bg-slate-50 rounded-[32px] border border-slate-100 border-dashed flex flex-center items-center justify-center">
                       <span className="text-slate-300 font-bold lowercase italic">generating visual assets...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comprehensive Qual Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Score Chart */}
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                       <Icons.Success className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                       <h4 className="text-lg font-black text-brand-primary tracking-normal lowercase leading-none">audited_performance</h4>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1.5">Neural Quality Assessment</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="relative h-40 flex flex-col items-center justify-center">
                       <div className="text-6xl font-black text-brand-primary tracking-normal tabular-nums drop-shadow-sm">
                         {Math.round((quality.overall_score || 0) * 100)}
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">composite score</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Visuals", score: quality.visual_score },
                        { label: "Narrative", score: quality.copy_score },
                        { label: "Brand Fit", score: quality.brand_alignment_score },
                        { label: "Platform", score: quality.platform_fit_score },
                      ].map((m, idx) => (
                        <div key={idx} className="p-4 bg-slate-50/50 rounded-[20px] border border-slate-100/50">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                             <span className="text-[10px] font-black text-brand-primary">{Math.round((m.score || 0) * 100)}%</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-linear-to-r from-brand-primary to-brand-secondary transition-all duration-1000"
                               style={{ width: `${(m.score || 0) * 100}%` }}
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Narrative Discovery */}
                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col gap-6 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                       <Icons.Mic className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                       <h4 className="text-lg font-black text-brand-primary tracking-normal lowercase leading-none">narrative_thread</h4>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1.5">Voiceover Script & Dynamic Overlays</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 bg-slate-50/80 rounded-[24px] border border-slate-100 relative overflow-hidden group/script">
                    <div className="absolute top-4 right-4 text-[9px] font-black text-slate-300 italic">27 Words_Synthesized</div>
                    <p className="text-sm font-medium text-brand-primary leading-relaxed italic pr-4">
                      "{nodes.generate_text?.result?.script?.script || "Initializing narrative matrix..."}"
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Dynamic Overlays</span>
                    <div className="flex flex-wrap gap-2">
                      {nodes.generate_text?.result?.overlays?.map((o: any, idx: number) => (
                        <div key={idx} className="px-3 py-1.5 bg-white border border-slate-100 rounded-[10px] text-[10px] font-bold text-brand-primary shadow-xs">
                          {o.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Orchestration Meta */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
              
              {/* Production Pipeline */}
              <div className="bg-linear-to-br from-brand-primary to-brand-secondary rounded-[40px] p-10 text-white shadow-2xl shadow-brand-primary/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="flex items-center gap-3 mb-10 relative z-10">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                     <Icons.Activity className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="flex flex-col">
                     <h4 className="text-lg font-black tracking-normal lowercase leading-none">orchestration_thread</h4>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1.5">Real-time Node Status</span>
                  </div>
                </div>

                <div className="flex flex-col gap-8 relative z-10">
                   {/* Neural Thread Line */}
                   <div className="absolute left-[13.5px] top-4 bottom-4 w-px bg-white/10" />

                   {steps.map((step, idx) => {
                     const status = getNodeStatus(step.id);
                     const isDone = status === "done";
                     const isRunning = status === "running";
                     const nodeData = nodes[step.id];

                     return (
                       <div key={step.id} className="flex gap-5">
                          <div className="relative">
                             <div className={cn(
                               "w-7 h-7 rounded-[10px] flex items-center justify-center transition-all duration-700 relative z-10",
                               isDone ? "bg-white text-brand-primary shadow-[0_0_15px_rgba(255,255,255,0.4)]" :
                               isRunning ? "bg-white/20 text-white animate-pulse" :
                               "bg-white/5 text-white/20 border border-white/5"
                             )}>
                               {isDone ? <Icons.Success className="w-3.5 h-3.5" /> : 
                                isRunning ? <Icons.Loader className="w-3.5 h-3.5 animate-spin" /> : 
                                <div className="w-1 h-1 rounded-full bg-white/20" />}
                             </div>
                          </div>
                          <div className="flex flex-col pt-0.5">
                             <span className={cn(
                               "text-[12px] font-bold tracking-tight transition-colors duration-500",
                               isDone ? "text-white" : isRunning ? "text-white/80" : "text-white/30"
                             )}>
                               {step.label}
                             </span>
                             {isDone && nodeData?.completed_at && (
                               <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest mt-1">
                                 Completed {new Date(nodeData.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             )}
                          </div>
                       </div>
                     );
                   })}
                </div>
              </div>

              {/* Implementation Parameters */}
              <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col gap-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                       <Icons.PenLine className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                       <h4 className="text-lg font-black text-brand-primary tracking-normal lowercase leading-none">implementation_intel</h4>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1.5">Creative Objective Matrix</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { label: "Target Audience", value: brief.target_audience || campaign.audience },
                      { label: "Product Context", value: brief.product_description || campaign.objective },
                      { label: "Atmosphere_Tone", value: `${brief.mood} / ${brief.tone || campaign.tones?.[0]}` },
                      { label: "Format_Canvas", value: brief.format || campaign.format },
                    ].map((p, idx) => (
                      <div key={idx} className="flex flex-col gap-1.5">
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 pl-1">{p.label}</span>
                         <div className="p-4 bg-slate-50/50 rounded-[18px] border border-slate-100/50">
                            <p className="text-[11px] font-bold text-brand-primary leading-relaxed">{p.value || "Config Default"}</p>
                         </div>
                      </div>
                    ))}
                  </div>

                  {/* Social Output Preview */}
                  {nodes.generate_text?.result?.platform_copy && (
                    <div className="flex flex-col gap-4 mt-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 pl-1">Social Captions Matrix</span>
                       <div className="p-6 bg-slate-50 border border-emerald-100/50 rounded-[28px] relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400/30" />
                          <div className="flex items-center gap-2 mb-3">
                             <Icons.Activity className="w-3.5 h-3.5 text-emerald-500" />
                             <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Optimized for Instagram</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed line-clamp-4">
                            {nodes.generate_text.result.platform_copy.instagram?.caption}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {nodes.generate_text.result.platform_copy.instagram?.hashtags?.slice(0, 5).map((h: string, idx: number) => (
                              <span key={idx} className="text-[9px] font-bold text-emerald-600/60 lowercase italic">{h}</span>
                            ))}
                          </div>
                       </div>
                    </div>
                  )}
              </div>

            </div>

          </div>
        </div>

        {/* Footer Area */}
        <div className="px-12 py-10 bg-white border-t border-slate-50 flex items-center justify-between shrink-0 relative z-20">
           <div className="flex items-center gap-8">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2">Production Status</span>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="text-[13px] font-black text-brand-primary lowercase tracking-tight">Audit Successfully Deployed</span>
                 </div>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2">Estimated Render Efficiency</span>
                 <span className="text-[13px] font-black text-brand-primary lowercase tracking-tight">
                   {nodes.render?.result?.render_seconds ? `${Math.round(nodes.render.result.render_seconds)} Seconds Sourced` : "N/A"}
                 </span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button className="h-14 px-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-brand-primary rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all active:scale-95">
                Download Intelligence PDF
              </button>
              <button className="h-14 px-10 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-[22px] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3">
                 <Icons.Rocket className="w-4 h-4" />
                 Initiate Client Hand-off
              </button>
           </div>
        </div>

        {/* Decorative Background Mesh */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-slate-200/20 blur-[120px] rounded-full pointer-events-none -mr-48 -mb-48" />
      </div>
    </div>
  );
}
