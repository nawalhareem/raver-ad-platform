"use client";

import React from "react";
import Image from "next/image";
import { Icons } from "@/components/ui/icons";
import { cn, formatFileSize, normalizeAssetUrl } from "@/lib/utils";

interface Asset {
  id: string | number;
  title?: string;
  name?: string;
  url?: string;
  imagePath?: string;
  time?: string;
  createdAt?: string;
  members?: number;
  type: string;
  aspectRatio?: string;
  hasVolume?: boolean;
  fileSize?: number;
  width?: number;
  height?: number;
}

interface AssetModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string | number) => void;
}

export default function AssetModal({ asset, isOpen, onClose, onDelete }: AssetModalProps) {
  const [isMuted, setIsMuted] = React.useState(true);
  const [videoError, setVideoError] = React.useState(false);
  const assetUrl = asset ? (asset.url || asset.imagePath || "") : "";
  const [imgSrc, setImgSrc] = React.useState("");

  React.useEffect(() => {
    if (assetUrl) {
      setImgSrc(normalizeAssetUrl(assetUrl));
    }
  }, [assetUrl]);
  
  if (!isOpen || !asset) return null;

  const handleDownload = () => {
    const url = asset.url || asset.imagePath;
    if (!url) return;

    const fileName = (asset.name || asset.title || "asset").toLowerCase().replace(/\s+/g, '-');
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=raver-${fileName}-${Date.now()}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideo = asset.type === "video" || 
    assetUrl.toLowerCase().split('?')[0].endsWith(".mp4") || 
    assetUrl.toLowerCase().split('?')[0].endsWith(".webm") || 
    assetUrl.toLowerCase().split('?')[0].endsWith(".mov");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 lg:pl-[280px]">
      <div className="bg-white w-full max-w-[541px] rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col p-3 gap-3 relative border border-white/20">
        
        {/* Top Preview Section */}
        <div className="relative w-full aspect-square bg-brand-primary rounded-[24px] overflow-hidden flex items-center justify-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-11 h-11 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-xl hover:bg-white/20 transition-all active:scale-95"
          >
            <Icons.Plus className="w-5 h-5 rotate-45 text-white" />
          </button>
          
          {asset.type === "audio" ? (
             <div className="flex flex-col items-center gap-10 w-full px-12 text-center">
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse rounded-full" />
                   <div className="relative w-[140px] h-[140px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[48px] flex items-center justify-center shadow-2xl">
                       <Icons.AudioWave className="w-16 h-16 text-white animate-pulse" />
                   </div>
                </div>
                
                <div className="flex flex-col gap-2">
                   <h3 className="text-white text-xl font-black tracking-tight">{asset.name || asset.title}</h3>
                   <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Audio Synthesis Master</span>
                </div>

                <audio 
                  src={normalizeAssetUrl(assetUrl)} 
                  controls 
                  className="w-full h-10 custom-audio-player filter invert brightness-200 opacity-80"
                  autoPlay
                />
             </div>
          ) : isVideo ? (
            <div className="relative w-full h-full">
              {videoError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 text-white gap-3 p-8">
                   <Icons.AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
                   <div className="flex flex-col gap-1 items-center">
                      <p className="text-xs font-black uppercase tracking-[0.2em]">Neural Stream Error</p>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest text-center">The asset signature could not be verified or the source is unavailable.</p>
                   </div>
                   <button 
                     onClick={() => { setVideoError(false); }}
                     className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                   >
                     Retry Connection
                   </button>
                </div>
              ) : (
                <video 
                  src={normalizeAssetUrl(assetUrl)} 
                  controls
                  autoPlay
                  muted={isMuted}
                  className="w-full h-full object-contain"
                  onError={() => setVideoError(true)}
                />
              )}
              {!videoError && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-4 right-4 z-30 w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all shadow-xl"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <Icons.Mute className="w-5 h-5" /> : <Icons.Volume className="w-5 h-5" />}
                </button>
              )}
            </div>
          ) : (
            <Image 
              src={imgSrc || normalizeAssetUrl(assetUrl)} 
              alt={asset.name || asset.title || "Asset"}
              fill
              className="object-contain p-8"
              onError={() => {
                setImgSrc("https://placehold.co/800x600?text=Asset");
              }}
            />
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex flex-col gap-4 p-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-brand-primary leading-tight tracking-tight">{asset.name || asset.title}</h2>
              <div className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest border",
                asset.type === "video" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                asset.type === "audio" ? "bg-blue-50 text-blue-600 border-blue-100" :
                "bg-slate-50 text-slate-600 border-slate-100"
              )}>
                {asset.type === "audio" ? "Neural Audio" : asset.type === "video" ? "4K Video" : "Static Asset"}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>{asset.width || 1920}x{asset.height || 1080} Resolution</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{formatFileSize(asset.fileSize)}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-blue-500">Uploaded {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : asset.time}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/80 p-5 rounded-2xl flex items-center gap-4 border border-slate-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                 <Icons.Maximize className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Asset Class</span>
                <span className="text-sm font-black text-brand-primary capitalize">{asset.type}</span>
              </div>
            </div>
            <div className="bg-slate-50/80 p-5 rounded-2xl flex items-center gap-4 border border-slate-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                 <Icons.Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Production Use</span>
                <span className="text-sm font-black text-brand-primary">{asset.members} Projects</span>
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="flex gap-4 pt-2">
            <button 
              onClick={handleDownload}
              className="flex-1 h-[48px] bg-white text-brand-primary rounded-xl border border-slate-200 text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
            >
              <Icons.Download className="w-4 h-4" /> Download
            </button>
            <button className="flex-[1.8] h-[48px] bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-[13px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group">
              <Icons.whiteMagicWand className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" /> 
              Deploy to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
