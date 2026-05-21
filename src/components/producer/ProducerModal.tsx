"use client";

import React, { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { LaunchBriefForm } from "./LaunchBriefForm";
import { LiveProductionTracker } from "./LiveProductionTracker";

interface ProducerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (data: any) => Promise<void>;
  isLoading: boolean;
  activeCampaign?: any;
}

export function ProducerModal({
  isOpen,
  onClose,
  onLaunch,
  isLoading,
  activeCampaign
}: ProducerModalProps) {
  const [hasLaunched, setHasLaunched] = useState(false);
  
  // Reset launch state when modal re-opens
  useEffect(() => {
    if (isOpen) setHasLaunched(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunchFlow = async (data: any) => {
    setHasLaunched(true);
    await onLaunch(data);
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#01012A]/60 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in" 
      />
      
      {/* Modal Container */}
      <div 
        className="relative bg-white w-full max-w-6xl max-h-[92vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Section */}
        <div className="px-10 pt-10 pb-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md relative z-20">
           <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-[22px] flex items-center justify-center shadow-xl transition-all duration-700",
                hasLaunched ? "bg-white shadow-white/20" : "bg-linear-to-r from-brand-primary to-brand-secondary shadow-brand-primary/20"
              )}>
                 {hasLaunched ? <Icons.Activity className="w-7 h-7 text-brand-primary" /> : <Icons.Rocket className="w-7 h-7 text-white" />}
              </div>
              <div className="flex flex-col">
                 <h3 className="text-3xl font-black text-brand-primary tracking-normal lowercase leading-none">
                   {hasLaunched ? "Live Orchestration" : "Orchestration Suite"}
                 </h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2 flex items-center gap-2">
                   <span className={cn(
                     "w-1.5 h-1.5 rounded-full",
                     hasLaunched ? "bg-white animate-pulse" : "bg-white animate-pulse"
                   )} />
                   {hasLaunched ? "Neural Production Thread Active" : "Narrative & Creative Configuration Matrix"}
                 </p>
              </div>
           </div>
           
           <button 
             onClick={onClose}
             className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group active:scale-95"
           >
              <Icons.Plus className="w-6 h-6 text-slate-400 group-hover:text-brand-primary rotate-45 transition-transform" />
           </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative z-10 bg-[#F8FAFC]">
           {!hasLaunched ? (
             <div className="max-w-5xl mx-auto py-8 px-6">
                <LaunchBriefForm 
                  onLaunch={handleLaunchFlow} 
                  isLoading={isLoading} 
                />
             </div>
           ) : (
             <div className="max-w-4xl mx-auto py-12 px-6 h-full">
                <div className="flex flex-col gap-8">
                  <div className="p-8 bg-linear-to-r from-brand-primary to-brand-secondary rounded-[32px] border border-white/10 flex items-center justify-between">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Active Thread ID</span>
                        <span className="text-xl font-black text-white tracking-normal">{activeCampaign?.id || "Initializing Matrix..."}</span>
                     </div>
                     <button 
                       onClick={onClose}
                       className="h-12 px-8 bg-white text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 active:scale-95 transition-all"
                     >
                       Continue to Dashboard
                     </button>
                  </div>
                  <LiveProductionTracker 
                    campaignId={activeCampaign?.campaign_id || activeCampaign?.id || "PENDING"}
                    status={activeCampaign?.status || "in_production"}
                    nodes={activeCampaign?.config?.nodes}
                  />
                </div>
             </div>
           )}
        </div>

        {/* Subtle Bottom Glow */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 h-32 pointer-events-none transition-colors duration-1000",
          hasLaunched ? "bg-linear-to-t from-blue-400/5 to-transparent" : "bg-linear-to-t from-slate-400/5 to-transparent"
        )} />
      </div>
    </div>
  );
}
