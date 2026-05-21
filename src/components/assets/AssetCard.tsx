"use client";

import React from "react";
import Image from "next/image";
import { Icons } from "@/components/ui/icons";
import { cn, formatFileSize, normalizeAssetUrl } from "@/lib/utils";

interface AssetCardProps {
  title: string;
  imagePath: string;
  time?: string;
  members?: number;
  fileSize?: number;
  type?: "image" | "video" | "audio" | "graphic";
  onClick?: () => void;
  className?: string;
  aspectRatio?: "portrait" | "landscape" | "square";
  hasVolume?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  isPlaying?: boolean;
  onPlayToggle?: (e: React.MouseEvent) => void;
}

export default function AssetCard({ 
  title, 
  imagePath, 
  time = "2 hours ago", 
  members = 3, 
  fileSize,
  type = "image",
  onClick, 
  className, 
  aspectRatio = "portrait",
  hasVolume = false,
  isSelectable = false,
  isSelected = false,
  isPlaying = false,
  onPlayToggle
}: AssetCardProps) {
  const [isMuted, setIsMuted] = React.useState(true);
  const [videoError, setVideoError] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [imgSrc, setImgSrc] = React.useState("");

  React.useEffect(() => {
    if (imagePath) {
      setImgSrc(normalizeAssetUrl(imagePath));
    }
  }, [imagePath]);
  
  const aspectClasses = {
    portrait: "aspect-3/4",
    landscape: "aspect-[4/3]",
    square: "aspect-square",
  };

  const isVideo = type === "video" || 
    imagePath?.toLowerCase().split('?')[0].endsWith(".mp4") || 
    imagePath?.toLowerCase().split('?')[0].endsWith(".webm") || 
    imagePath?.toLowerCase().split('?')[0].endsWith(".mov");

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative rounded-[24px] overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-primary/10 bg-[#F8F8F8] border border-transparent hover:border-slate-200",
        aspectClasses[aspectRatio],
        isSelected && "ring-2 ring-brand-primary ring-offset-2",
        className
      )}
    >
      {type === "audio" ? (
         <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-brand-primary via-[#1A1A3F] to-brand-secondary">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 opacity-40">
               <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-[60px] animate-pulse" />
               <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500 rounded-full blur-[60px] animate-pulse delay-700" />
            </div>

            <div className="w-full h-full relative flex flex-col items-center justify-center transition-all duration-700 gap-6 z-10 px-6 text-center">
               <div className="relative group/play">
                  <div className={cn(
                    "w-[140px] h-[140px] rounded-[40px] flex items-center justify-center transition-all duration-500",
                    isPlaying ? "bg-white/10 backdrop-blur-xl border border-white/20 scale-105" : "bg-white/5 border border-white/10"
                  )}>
                     <Icons.AudioWave className={cn(
                       "w-16 h-16 transition-all duration-500", 
                       isPlaying ? "text-white animate-pulse" : "text-white/20"
                     )} />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayToggle?.(e);
                    }}
                    className="absolute inset-0 flex items-center justify-center group-hover/play:opacity-100 transition-opacity"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
                      isPlaying ? "bg-white text-brand-primary scale-110" : "bg-white/10 backdrop-blur-md text-white border border-white/20 scale-0 group-hover/play:scale-100"
                    )}>
                      {isPlaying ? <Icons.Pause className="w-6 h-6 fill-current" /> : <Icons.Play className="w-6 h-6 ml-1 fill-current" />}
                    </div>
                  </button>
               </div>

               <div className="flex flex-col gap-1">
                 <h3 className="text-white text-sm font-black tracking-tight leading-tight">{title}</h3>
                 <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
                   {isPlaying ? "Synchronizing Production" : "Neural Audio Asset"}
                 </span>
               </div>
            </div>
            
            <div className="absolute top-4 left-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                  <Icons.Mic className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest leading-none">Voice & Audio</span>
               </div>
            </div>
         </div>
      ) : isVideo ? (
        <div className="w-full h-full relative">
           {videoError ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-300 gap-2 p-4">
                <Icons.AlertTriangle className="w-8 h-8 opacity-20" />
                <span className="text-xs font-black uppercase tracking-widest text-center">Video Unavailable</span>
             </div>
           ) : (
              <video 
               ref={videoRef}
               src={normalizeAssetUrl(imagePath)} 
               muted={isMuted} 
               autoPlay
               loop
               playsInline
               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
               onError={() => setVideoError(true)}
             />
          )}
          <div className="absolute top-4 left-4 z-10">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                <Icons.Video className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest leading-none">Video Production</span>
             </div>
          </div>
          
          {!videoError && (
            <button 
              onClick={toggleMute}
              className="absolute top-4 right-4 z-30 w-9 h-9 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <Icons.Mute className="w-4 h-4" /> : <Icons.Volume className="w-4 h-4" />}
            </button>
          )}
        </div>
      ) : (
        <>
          <Image 
            src={imgSrc || normalizeAssetUrl(imagePath)} 
            alt={title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
            onError={() => {
              setImgSrc("https://placehold.co/600x800?text=Asset");
            }}
          />
          <div className="absolute top-4 left-4 z-10">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                <Icons.Image className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-black text-brand-primary uppercase tracking-widest leading-none">Still Asset</span>
             </div>
          </div>
        </>
      )}
      
      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 z-20">
        <div className="flex flex-col gap-4 translate-y-8 group-hover:translate-y-0 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)">
          <div className="flex flex-col gap-2">
            <h3 className="text-white text-lg font-black leading-none tracking-tight drop-shadow-2xl">{title}</h3>
            
            <div className="flex items-center gap-4 text-white/60">
              <div className="flex items-center gap-1.5">
                <Icons.Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-widest">{time}</span>
              </div>
              {fileSize && (
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                  <Icons.Database className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-widest">{formatFileSize(fileSize)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (type === "audio") {
                  onPlayToggle?.(e);
                } else {
                  onClick?.();
                }
              }}
              className="flex-1 h-11 bg-white text-brand-primary rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              {type === "audio" ? (
                <>
                  {isPlaying ? <Icons.Pause className="w-3 h-3" /> : <Icons.Play className="w-3 h-3 ml-0.5" />}
                  <span>{isPlaying ? "Pause" : "Play"}</span>
                </>
              ) : (
                <>
                  <Icons.Eye className="w-3 h-3 text-blue-500" />
                  <span>Inspect</span>
                </>
              )}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClick?.(); }}
              className="w-11 h-11 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center"
            >
               <Icons.ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Status Badges */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10 transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 opacity-100 group-hover:opacity-0">
        {(hasVolume || isVideo || type === "audio") && (
          <div className="bg-black/40 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 shadow-lg">
             {type === "audio" ? <Icons.Mic className="w-4 h-4 text-blue-400" /> : <Icons.Video className="w-4 h-4 text-emerald-400" />}
          </div>
        )}
      </div>
    </div>
  );
}
