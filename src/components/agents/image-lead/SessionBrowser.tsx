"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

interface Session {
  id?: string;
  sessionId?: string;
  tag?: string;
  createdAt?: string;
  mainImageUrl?: string;
  scenes?: { label: string | number; url: string }[];
  metadata?: {
    scenes?: { label: string | number; url: string }[];
  };
}

interface SessionBrowserProps {
  sessions: Session[];
  activeSessionId: string;
  onSelect: (session: Session) => void;
  onReset: () => void;
}

export function SessionBrowser({ 
  sessions, 
  activeSessionId, 
  onSelect, 
  onReset 
}: SessionBrowserProps) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
        {sessions.map((s) => {
          const sid = s.sessionId || s.id || "";
          const isActive = activeSessionId === sid;
          const thumbnail = s.mainImageUrl || s.scenes?.[0]?.url || s.metadata?.scenes?.[0]?.url;

          return (
            <button
              key={sid}
              onClick={() => onSelect(s)}
              onDoubleClick={onReset}
              className={cn(
                "group flex flex-col gap-3 p-3 rounded-[24px] border transition-all min-w-[200px] text-left relative overflow-hidden shrink-0",
                isActive 
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-xl shadow-black/10 -translate-y-1" 
                  : "bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {/* Thumbnail Preview */}
              <div className="relative aspect-video w-full rounded-[18px] overflow-hidden bg-slate-100 border border-black/3">
                {thumbnail ? (
                  <img src={thumbnail} alt="Session Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Icons.Image className="w-8 h-8" />
                  </div>
                )}
                {isActive && (
                   <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-0 duration-300">
                      <Icons.CheckCircle className="w-3 h-3 text-white" />
                   </div>
                )}
              </div>

              <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black truncate tracking-normal uppercase opacity-80">
                    {s.tag || sid.replace("raver_campaign_", "ID: ")}
                  </span>
                  <Icons.Clock className={cn("w-3 h-3", isActive ? "opacity-100" : "opacity-30")} />
                </div>
                {s.createdAt && (
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest",
                    isActive ? "opacity-40" : "opacity-30"
                  )}>
                    {new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* View All Sessions Button */}
        {activeSessionId && (
          <button 
            onClick={onReset}
            className="text-xs font-bold text-slate-500 hover:text-[#0A0A0A] underline ml-2 whitespace-nowrap transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}
