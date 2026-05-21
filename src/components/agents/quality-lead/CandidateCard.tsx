"use client";

import React from "react";
import { Icons } from "@/components/ui/icons";
import { cn, normalizeAssetUrl } from "@/lib/utils";

interface CandidateCardProps {
  id: string;
  sessionId: string;
  campaignId: string;
  type: string;
  label: string;
  url: string | null;
  createdAt: string;
  raw: any;
  onAudit: (candidate: any) => void;
}

export function CandidateCard({
  id,
  sessionId,
  campaignId,
  type,
  label,
  url,
  createdAt,
  raw,
  onAudit
}: CandidateCardProps) {
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

  const renderPreview = () => {
    switch (type) {
      case "Editor":
      case "Producer":
      case "Director":
      case "video_synthesis": // Backward compatibility
      case "producer_render":
      case "director_session":
        return normalizedUrl ? (
          <video 
            src={normalizedUrl} 
            muted 
            loop 
            autoPlay 
            playsInline
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full bg-brand-primary/5 flex items-center justify-center">
            <Icons.Video className="w-8 h-8 text-brand-primary/20" />
          </div>
        );
      
      case "Audio":
      case "audio_mix":
        return (
          <div className="w-full h-full bg-linear-to-br from-brand-primary to-brand-secondary flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center animate-pulse">
              <Icons.Mic className="w-6 h-6 text-white/40" />
            </div>
            <div className="flex gap-[2px] items-center h-4">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-white/30 rounded-full" 
                  style={{ height: `${h * 100}%` }} 
                />
              ))}
            </div>
          </div>
        );

      case "Image":
      case "image_scenes":
        return normalizedUrl ? (
          <img 
            src={normalizedUrl} 
            alt={label}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
          />
        ) : (
          <div className="w-full h-full bg-brand-primary/5 flex items-center justify-center">
            <Icons.Image className="w-8 h-8 text-brand-primary/20" />
          </div>
        );

      case "Copy":
      case "copy_script":
        return (
          <div className="w-full h-full bg-[#F8FAFC] p-6 flex flex-col gap-3">
             <div className="flex items-center gap-2">
               <Icons.Files className="w-4 h-4 text-blue-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Brand Script</span>
             </div>
             <p className="text-[12px] font-medium text-slate-500 line-clamp-4 leading-relaxed italic">
               "{
                 (typeof raw?.script === 'object' && raw.script !== null ? raw.script.script : (raw?.script || raw?.content)) 
                 || "No script content available for this candidate."
               }"
             </p>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
            <Icons.Activity className="w-8 h-8 text-slate-200" />
          </div>
        );
    }
  };

  const getBadgeStyles = () => {
    switch (type) {
      case "Editor":
      case "video_synthesis": return "bg-blue-500";
      case "Audio":
      case "audio_mix": return "bg-purple-500";
      case "Copy":
      case "copy_script": return "bg-emerald-500";
      case "Image":
      case "image_scenes": return "bg-pink-500";
      case "Producer": return "bg-amber-500";
      case "Director": return "bg-indigo-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div 
      className="group flex flex-col bg-white border border-[#E2E8F0] rounded-[24px] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(1,1,42,0.08)] hover:-translate-y-1"
    >
      {/* Asset Preview */}
      <div className="relative aspect-video overflow-hidden">
        {renderPreview()}
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-[0.2em] shadow-lg",
            getBadgeStyles()
          )}>
            {type.replace("_", " ")}
          </span>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-brand-primary/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <button 
            onClick={() => onAudit({ id, sessionId, campaignId, type, label, url, createdAt, raw })}
            className="px-6 py-2.5 bg-white text-brand-primary rounded-xl font-black text-[10px] uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl"
          >
            Initiate Audit
          </button>
        </div>
      </div>

      {/* Candidate Metadata */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
           <h4 className="text-[13px] font-black text-brand-primary tracking-normal uppercase truncate pr-4">
             {label}
           </h4>
           <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
             <Icons.ShieldCheck className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
           </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
           <div className="flex items-center justify-between">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Orchestration ID</span>
             <span className="text-[9px] font-black text-brand-primary font-mono">{id.slice(0, 12)}...</span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Synthesis Date</span>
             <span className="text-[9px] font-black text-brand-primary">
               {new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
             </span>
           </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAudit({ id, sessionId, campaignId, type, label, url, createdAt, raw });
          }}
          className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group/btn"
        >
          <Icons.Eye className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white transition-colors" />
          View Audit Details
        </button>
      </div>
    </div>
  );
}
