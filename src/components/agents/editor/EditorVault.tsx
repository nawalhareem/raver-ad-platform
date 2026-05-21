"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn, normalizeAssetUrl } from "@/lib/utils";
import { toast } from "react-toastify";

interface VideoAsset {
  id: string;
  url: string;
  thumbnail?: string;
  format: string;
  timestamp: string;
  status: "completed" | "processing" | "failed";
  label?: string;
  sessionId?: string;
  metadata?: any;
  type?: "render" | "export";
}

interface VideoVaultProps {
  videos: VideoAsset[];
  isLoading: boolean;
  onPreview: (video: VideoAsset) => void;
  onDelete?: (id: string) => void;
  isGlobalArchive?: boolean;
}

export function EditorVault({ videos, isLoading, onPreview, onDelete, isGlobalArchive }: VideoVaultProps) {
  const handleCopyUrl = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(normalizeAssetUrl(url));
    toast.success("Video synthesis URL copied to clipboard");
  };

  if (isLoading && videos.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[32px] p-20 flex flex-col items-center justify-center gap-6 text-center">
         <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center border border-slate-100 shadow-sm animate-pulse">
            <Icons.Loader className="w-8 h-8 text-slate-300 animate-spin" />
         </div>
         <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">Neural Archives Syncing...</h3>
            <p className="text-sm text-slate-400 font-bold max-w-xs text-balance">Accessing the synthesis archives to retrieve your rendered campaigns.</p>
         </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-100 rounded-[32px] p-20 flex flex-col items-center justify-center gap-6 text-center">
         <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center border border-slate-100 shadow-sm">
            <Icons.Video className="w-8 h-8 text-slate-200" />
         </div>
         <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">zero video assets found_</h3>
            <p className="text-sm text-slate-400 font-bold max-w-xs text-balance">The archives are currently empty. Initiate your first video synthesis to begin populating your neural vault.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-slate-50 pb-6">
        <div className="flex items-center gap-3">
          <Icons.Files className="w-5 h-5 text-brand-primary" />
          <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">
            {isGlobalArchive ? "Global Editor Synthesis Archives" : "Active Session Results"}
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
           <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{videos.length} Campaigns Synthesized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="group relative flex flex-col bg-white border border-slate-100 rounded-[28px] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(1,1,42,0.06)] hover:-translate-y-1 cursor-pointer"
            onClick={() => video.status === "completed" && onPreview(video)}
          >
            {/* Thumbnail/Preview Area */}
            <div className="relative aspect-video bg-slate-100 overflow-hidden">
              {video.status === "processing" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-r from-brand-primary to-brand-secondary backdrop-blur-md z-10 transition-all">
                  <Icons.Loader className="w-6 h-6 text-white animate-spin mb-2" />
                  <p className="text-white text-[10px] font-black uppercase tracking-widest animate-pulse">Synthesis Running</p>
                </div>
              ) : video.url ? (
                <div className="w-full h-full relative group/video">
                  <video 
                    src={video.url} 
                    muted 
                    loop 
                    playsInline 
                    autoPlay 
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                  />
                  {/* Subtle overlay for better badge readability */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all pointer-events-none" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icons.Video className="w-10 h-10 text-slate-200" />
                </div>
              )}

              {/* Status & Format Badges */}
              <div className="absolute top-4 left-4 flex gap-2 z-20">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-black text-white uppercase tracking-[0.2em]">
                  {video.format}
                </span>
              </div>

              {/* Action Overlays */}
              {video.status === "completed" && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 flex flex-col gap-2">
                  <button 
                    onClick={(e) => handleCopyUrl(e, video.url)}
                    className="w-8 h-8 rounded-lg bg-white shadow-xl flex items-center justify-center text-brand-primary hover:bg-linear-to-r hover:from-brand-primary hover:to-brand-secondary hover:text-white transition-all border border-slate-100 active:scale-95"
                    title="Copy Video URL"
                  >
                    <Icons.Copy className="w-3.5 h-3.5" />
                  </button>
                  {onDelete && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
                      className="w-8 h-8 rounded-lg bg-red-50 shadow-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-50 active:scale-95"
                      title="Archive Render"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Center Play Icon */}
              {video.status === "completed" && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                   <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 scale-75 group-hover:scale-100 transition-transform duration-300">
                     <Icons.Play className="w-5 h-5 text-white fill-current" />
                   </div>
                </div>
              )}
            </div>

            {/* Info Footer */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-bold text-brand-primary line-clamp-1 truncate flex-1 pr-4">
                  {video.label || "Neutral Video Synthesis"}
                </h4>
              </div>
              <div className="flex items-center justify-between pt-1">
                 <div className="flex items-center gap-2">
                    <Icons.Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-normal">
                      {new Date(video.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                 </div>
                 {video.sessionId && (
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                      SID: {video.sessionId.slice(0, 12)}
                    </span>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
