"use client";

import React, { useState, useMemo } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface CopyAsset {
  id: string;
  type: "package" | "produce" | "script" | "caption" | "captions" | "overlays" | "cta" | "hashtags";
  content: string | any;
  timestamp: string;
  session_id: string;
  business_name?: string;
  platform?: string;
}

interface CopyVaultProps {
  assets: CopyAsset[];
  onCopy: (content: string) => void;
  isLoading: boolean;
  isGlobalArchive?: boolean;
  className?: string;
  onDelete?: (sessionId: string) => void;
}

const FILTER_CATEGORIES = [
  { id: "all", label: "All Synthesis", icon: Icons.Files },
  { id: "package", label: "Packages", icon: Icons.MagicWand, types: ["package", "produce"] },
  { id: "script", label: "Scripts", icon: Icons.Mic },
  { id: "captions", label: "Captions", icon: Icons.Smartphone, types: ["caption", "captions"] },
  { id: "overlays", label: "Overlays", icon: Icons.AIAgents },
  { id: "cta", label: "CTAs", icon: Icons.Text },
  { id: "hashtags", label: "Hashtags", icon: Icons.Dashboard }
];

export function CopyVault({ 
  assets, 
  onCopy, 
  isLoading, 
  isGlobalArchive, 
  className,
  onDelete
}: CopyVaultProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredAssets = useMemo(() => {
    if (activeFilter === "all") return assets;
    const category = FILTER_CATEGORIES.find(c => c.id === activeFilter);
    const types = category?.types || [activeFilter];
    return assets.filter(a => types.includes(a.type));
  }, [assets, activeFilter]);

  const getCount = (categoryId: string) => {
    if (categoryId === "all") return assets.length;
    const category = FILTER_CATEGORIES.find(c => c.id === categoryId);
    const types = category?.types || [categoryId];
    return assets.filter(a => types.includes(a.type)).length;
  };
  
  if (isLoading && assets.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[32px] p-10 sm:p-20 flex flex-col items-center justify-center gap-6 text-center">
         <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center border border-slate-100 shadow-sm animate-pulse">
            <Icons.Loader className="w-8 h-8 text-slate-300 animate-spin" />
         </div>
         <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">
              {isGlobalArchive ? "Neural Archives Syncing..." : "Session Vault Syncing..."}
            </h3>
            <p className="text-sm text-slate-400 font-bold max-w-xs">Accessing the synthesis archives to retrieve your copy assets.</p>
         </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-100 rounded-[32px] p-10 sm:p-20 flex flex-col items-center justify-center gap-6 text-center">
         <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center border border-slate-100 shadow-sm">
            <Icons.Text className="w-8 h-8 text-slate-200" />
         </div>
         <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-brand-primary tracking-normal lowercase">
              {isGlobalArchive ? "zero synthesis results found_" : "no copy assets synthesized_"}
            </h3>
            <p className="text-sm text-slate-400 font-bold max-w-xs text-balance">
              {isGlobalArchive ? "The archives are currently empty. Initiate your first synthesis to begin." : "Initiate a neural synthesis via the orchestration hub."}
            </p>
         </div>
      </div>
    );
  }

  return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-6">
          <div className="flex items-center gap-3">
            <Icons.Files className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg sm:text-xl font-black text-brand-primary tracking-normal lowercase">
              {isGlobalArchive ? "Global Copy Archives" : "Session Audit Vault"}
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 self-start sm:self-auto">
             <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-brand-primary">{assets.length} Total Results</span>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {FILTER_CATEGORIES.map((category) => {
            const count = getCount(category.id);
            const isActive = activeFilter === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all border whitespace-nowrap active:scale-95 group",
                  isActive 
                    ? "bg-linear-to-r from-brand-primary to-brand-secondary text-white border-brand-primary shadow-lg shadow-brand-primary/10" 
                    : count > 0 
                      ? "bg-white text-slate-400 border-slate-100 hover:border-brand-primary hover:text-white hover:bg-linear-to-r hover:from-brand-primary hover:to-brand-secondary shadow-sm"
                      : "bg-slate-50/50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60"
                )}
                disabled={count === 0 && activeFilter !== "all"}
              >
                <category.icon className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors", 
                  isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                )} />
                {category.label}
                <span className={cn(
                  "ml-1 px-1 sm:px-1.5 py-0.5 rounded-md text-[7px] sm:text-[8px] transition-colors",
                  isActive ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-400 group-hover:bg-white/10 group-hover:text-white/50"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset, idx) => (
            <div key={`${asset.id}-${idx}`} className="flex flex-col gap-4 group/card h-full">
              <div className="relative bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(1,1,42,0.05)] hover:-translate-y-1 overflow-hidden flex-1 flex flex-col">
                
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex flex-wrap gap-1.5 min-w-0">
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border backdrop-blur-md shadow-sm",
                      asset.type === "package" || asset.type === "produce" ? "bg-purple-500/10 text-purple-600 border-purple-200" :
                      asset.type === "script" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                      "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                    )}>
                      {asset.type}
                    </div>

                    {asset.platform && (
                      <div className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border bg-slate-50 text-slate-500 border-slate-200 backdrop-blur-md">
                        {asset.platform}
                      </div>
                    )}

                    {asset.content?.tone && (
                      <div className="hidden sm:block px-2.5 py-1 rounded-lg text-[8px] font-black tracking-[0.15em] border bg-amber-500/10 text-amber-600 border-amber-200 backdrop-blur-md shadow-sm lowercase">
                        {asset.content.tone}
                      </div>
                    )}

                    {asset.business_name && (
                      <div className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border bg-blue-500/10 text-blue-600 border-blue-200 backdrop-blur-md shadow-sm">
                        {asset.business_name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(asset.session_id)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-xs border border-red-100/30 group/del"
                        title="Archive Synthesis"
                      >
                        <Icons.Trash className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/del:scale-110 transition-transform" />
                      </button>
                    )}
                    <button 
                      onClick={() => onCopy(typeof asset.content === "string" ? asset.content : JSON.stringify(asset.content, null, 2))}
                      className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-linear-to-r hover:from-brand-primary hover:to-brand-secondary hover:text-white transition-all active:scale-90 shadow-xs border border-slate-100 group/btn"
                      title="Copy to clipboard"
                    >
                      <Icons.Files className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {asset.type === "package" && typeof asset.content === "object" ? (
                      <div className="space-y-6 sm:space-y-8">
                        {/* Script Section */}
                        {asset.content.script?.script && (
                          <div className="space-y-3">
                             <div className="flex items-center gap-2">
                               <Icons.Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Narrative Script</span>
                             </div>
                             <div className="p-5 sm:p-6 bg-blue-50/30 rounded-[24px] sm:rounded-[28px] border border-blue-100/30">
                                <p className="text-[12px] sm:text-[13px] font-bold text-brand-primary leading-relaxed italic">"{asset.content.script.script}"</p>
                             </div>
                          </div>
                        )}

                        {/* Overlays Section */}
                        {asset.content.overlays && Array.isArray(asset.content.overlays) && (
                          <div className="space-y-3">
                             <div className="flex items-center gap-2">
                               <Icons.AIAgents className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500" />
                               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Visual Overlays</span>
                             </div>
                             <div className="space-y-2">
                                {asset.content.overlays.map((overlay: any, oidx: number) => (
                                  <div key={oidx} className="p-3.5 sm:p-4 bg-slate-50/50 rounded-xl sm:rounded-2xl border border-slate-100 flex items-start gap-3">
                                     <span className="text-[9px] font-black text-slate-300 mt-1">#{overlay.scene_id || oidx + 1}</span>
                                     <p className="text-[11px] sm:text-[12px] font-bold text-brand-primary">{overlay.text}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}

                        {/* Platform Copy Section */}
                        {asset.content.platform_copy && (
                          <div className="space-y-6">
                             {Object.entries(asset.content.platform_copy).map(([platform, copy]: [string, any]) => (
                               <div key={platform} className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Icons.Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">{platform} Optimization</span>
                                  </div>
                                  
                                  {copy.caption && (
                                    <div className="p-4 sm:p-5 bg-emerald-50/20 rounded-[20px] sm:rounded-[24px] border border-emerald-100/30">
                                      <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600/50 block mb-2">Caption</span>
                                      <p className="text-[11px] sm:text-[12px] font-bold text-brand-primary leading-relaxed">{copy.caption}</p>
                                    </div>
                                  )}

                                  {copy.cta && (
                                    <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl">
                                      <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Call to Action</span>
                                      <p className="text-[10px] sm:text-[11px] font-black text-brand-primary">{copy.cta}</p>
                                    </div>
                                  )}

                                  {copy.hashtags && Array.isArray(copy.hashtags) && (
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                      {copy.hashtags.map((tag: string) => (
                                        <span key={tag} className="text-[8px] sm:text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">{tag}</span>
                                      ))}
                                    </div>
                                  )}
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    ) : Array.isArray(asset.content) ? (
                      <div className="flex flex-wrap gap-2">
                         {asset.content.map((v: any, i: number) => (
                           <span key={i} className={cn(
                             "px-3 py-1 rounded-xl border text-[11px] font-bold",
                             typeof v === 'string' && v.startsWith('#') 
                               ? "bg-blue-50 text-blue-600 border-blue-100" 
                               : "bg-slate-50 text-slate-600 border-slate-100"
                           )}>
                             {typeof v === 'object' && v.text ? v.text : typeof v === 'object' ? JSON.stringify(v) : v}
                           </span>
                         ))}
                      </div>
                    ) : typeof asset.content === "string" ? (
                      <p className="text-[12px] sm:text-[13px] font-bold text-brand-primary leading-relaxed whitespace-pre-wrap italic opacity-90">"{asset.content}"</p>
                    ) : (
                      <div className="space-y-4">
                           {Object.entries(asset.content)
                             .filter(([key, value]) => {
                               const skipKeys = ["status", "platform", "session_id", "id", "business_name", "tone"];
                               return !skipKeys.includes(key.toLowerCase()) || typeof value === "object";
                             })
                             .map(([key, value]: [string, any]) => (
                               <div key={key} className="p-4 sm:p-5 bg-slate-50/50 rounded-[20px] sm:rounded-[24px] border border-slate-100/50">
                                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">{key.replace(/_/g, ' ')}</span>
                                  <div className="text-[11px] sm:text-[12px] font-bold text-brand-primary leading-relaxed">
                                    {Array.isArray(value) ? (
                                      <div className="flex flex-wrap gap-1">
                                        {value.map((v, i) => (
                                          <span key={i} className={cn(
                                            "px-2 py-0.5 rounded-lg border",
                                            typeof v === 'string' && v.startsWith('#') 
                                              ? "bg-blue-50 text-blue-600 border-blue-100" 
                                              : "bg-white text-slate-600 border-slate-100"
                                          )}>
                                            {typeof v === 'object' && v.text ? v.text : typeof v === 'object' ? JSON.stringify(v) : v}
                                          </span>
                                        ))}
                                      </div>
                                    ) : typeof value === 'object' ? (
                                      <pre className="text-[10px] font-mono whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                                    ) : value}
                                  </div>
                               </div>
                           ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pb-2">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Icons.Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-normal">
                         {new Date(asset.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    {asset.business_name && (
                      <div className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-blue-400" />
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-normal">
                           {asset.business_name}
                         </span>
                      </div>
                    )}
                 </div>
                 
                 {asset.platform && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full h-fit w-fit">
                      <Icons.Smartphone className="w-2.5 h-2.5 text-blue-400" />
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none">
                        {asset.platform}
                      </span>
                    </div>
                 )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
               <Icons.Search className="w-6 h-6 text-slate-200" />
            </div>
            <div className="space-y-1">
               <p className="text-sm font-black text-brand-primary tracking-tight">No {activeFilter} assets found</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust your filter or initiate a new synthesis</p>
            </div>
            <button 
              onClick={() => setActiveFilter("all")}
              className="mt-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
            >
              View All Synthesis
            </button>
          </div>
        )}
      </div>
      </div>
  );
}
