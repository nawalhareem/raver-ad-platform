"use client";

import React from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "./AudioPlayer";

interface AudioAsset {
  filename: string;
  url: string;
  type: "music" | "voiceover" | "full";
  timestamp: string;
  session_id: string;
  business_name?: string;
}

interface AudioVaultProps {
  assets: AudioAsset[];
  onDownload: (url: string) => void;
  isLoading: boolean;
  isGlobalArchive?: boolean;
  className?: string;
  selectedMusicUrl?: string;
  selectedVoiceoverUrl?: string;
  onSelectMusic?: (url: string) => void;
  onSelectVoiceover?: (url: string) => void;
  onDelete?: (sessionId: string) => void;
  onCopyUrl?: (url: string) => void;
}

export function AudioVault({ 
  assets, 
  onDownload, 
  isLoading, 
  isGlobalArchive, 
  className,
  selectedMusicUrl,
  selectedVoiceoverUrl,
  onSelectMusic,
  onSelectVoiceover,
  onDelete,
  onCopyUrl
}: AudioVaultProps) {
  if (isLoading && assets.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[32px] p-20 flex flex-col items-center justify-center gap-6 text-center">
         <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center border border-slate-100 shadow-sm animate-pulse">
            <Icons.Loader className="w-8 h-8 text-slate-300 animate-spin" />
         </div>
         <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">
              {isGlobalArchive ? "Neural Archives Syncing..." : "Session Vault Syncing..."}
            </h3>
            <p className="text-sm text-slate-400 font-bold max-w-xs">Accessing the synthesis archives to retrieve your audio assets.</p>
         </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-100 rounded-[32px] p-20 flex flex-col items-center justify-center gap-6 text-center">
         <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center border border-slate-100 shadow-sm">
            <Icons.Mic className="w-8 h-8 text-slate-200" />
         </div>
         <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">
              {isGlobalArchive ? "zero synthesis results found_" : "no session assets synthesized_"}
            </h3>
            <p className="text-sm text-slate-400 font-bold max-w-xs text-balance">
              {isGlobalArchive ? "The archives are currently empty. Initiate your first synthesis to begin populating your neural vault." : "Initiate a neural synthesis via the orchestration hub to populate this session vault."}
            </p>
         </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div className="flex items-center justify-between border-b border-slate-50 pb-6">
        <div className="flex items-center gap-3">
          <Icons.Files className="w-5 h-5 text-brand-primary" />
          <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">
            {isGlobalArchive ? "Global Synthesis Archives" : "Session Audit Vault"}
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
           <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{assets.length} Assets Found</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assets.map((asset, idx) => (
          <div key={`${asset.session_id}-${idx}`} className="flex flex-col gap-4 group/card">
            <div className={cn(
              "relative bg-white border rounded-[34px] p-2 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(1,1,42,0.05)] hover:-translate-y-1",
              (asset.url === selectedMusicUrl || asset.url === selectedVoiceoverUrl) 
                ? "border-blue-500 shadow-[0_10px_30px_rgba(59,130,246,0.1)] mb-2" 
                : "border-slate-100"
            )}>
              <div className={cn(
                "absolute top-5 right-5 z-20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border backdrop-blur-md shadow-sm",
                asset.type === "full" ? "bg-purple-500/10 text-purple-600 border-purple-200" :
                asset.type === "music" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                "bg-emerald-500/10 text-emerald-600 border-emerald-200"
              )}>
                {asset.type}
              </div>
              
              <AudioPlayer 
                url={asset.url}
                title={asset.business_name || asset.filename.split('/').pop()?.split('_').filter(s => s.length > 5).join(' ') || "Neural Audio Asset"}
                className="border-none bg-transparent shadow-none p-4"
              />

              {/* Selection Button */}
              {(asset.type === "music" || asset.type === "voiceover") && (
                <button
                  onClick={() => {
                    if (asset.type === "music") onSelectMusic?.(asset.url === selectedMusicUrl ? "" : asset.url);
                    else onSelectVoiceover?.(asset.url === selectedVoiceoverUrl ? "" : asset.url);
                  }}
                  className={cn(
                    "absolute bottom-4 right-4 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all scale-0 group-hover/card:scale-100 shadow-lg",
                    (asset.url === selectedMusicUrl || asset.url === selectedVoiceoverUrl)
                      ? "bg-blue-500 text-white scale-100"
                      : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
                  )}
                >
                  <Icons.Check className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between px-6">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Icons.Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-normal">
                       {new Date(asset.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  {asset.business_name && (
                    <div className="flex items-center gap-2">
                       <Icons.Dashboard className="w-3 h-3 text-blue-400" />
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-normal">
                         {asset.business_name}
                       </span>
                    </div>
                  )}
                  {isGlobalArchive && (
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-slate-200" />
                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                         {asset.session_id.slice(0, 16)}...
                       </span>
                    </div>
                  )}
               </div>
               
               <div className="flex items-center gap-2">
                 {onDelete && (
                    <button 
                      onClick={() => onDelete(asset.session_id)}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                      title="Archive Synthesis"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                 )}
                 {onCopyUrl && (
                    <button 
                      onClick={() => onCopyUrl(asset.url)}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-400 hover:bg-blue-500 hover:text-white transition-all active:scale-90 shadow-sm"
                      title="Copy Neural URL"
                    >
                      <Icons.Copy className="w-3.5 h-3.5" />
                    </button>
                 )}
                 <button 
                  onClick={() => onDownload(asset.url)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-linear-to-r hover:from-brand-primary hover:to-brand-secondary  hover:text-white transition-all active:scale-90 shadow-sm"
                  title="Download Neural Asset"
                 >
                   <Icons.Download className="w-4 h-4" />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
