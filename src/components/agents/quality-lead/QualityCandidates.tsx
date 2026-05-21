"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { CandidateCard } from "./CandidateCard";
import { cn } from "@/lib/utils";

interface QualityCandidatesProps {
  candidates: {
    video_synthesis: any[];
    audio_mix: any[];
    image_scenes: any[];
    copy_script: any[];
    producer_render: any[];
    director_session: any[];
  } | null;
  isLoading: boolean;
  onAudit: (candidate: any) => void;
}

export function QualityCandidates({ candidates, isLoading, onAudit }: QualityCandidatesProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const counts = React.useMemo(() => {
    if (!candidates) return { all: 0, video: 0, Audio: 0, Image: 0, Copy: 0 };
    return {
      all: Object.values(candidates).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0),
      video: (candidates.video_synthesis?.length || 0) + (candidates.producer_render?.length || 0) + (candidates.director_session?.length || 0),
      Audio: candidates.audio_mix?.length || 0,
      Image: candidates.image_scenes?.length || 0,
      Copy: candidates.copy_script?.length || 0,
    };
  }, [candidates]);

  const filters = [
    { id: "all", label: "All Audits", count: counts.all, icon: Icons.Activity },
    { id: "video", label: "Video Renders", count: counts.video, icon: Icons.Film },
    { id: "Audio", label: "Audio Mixes", count: counts.Audio, icon: Icons.Mic },
    { id: "Image", label: "Visual Foundations", count: counts.Image, icon: Icons.Image },
    { id: "Copy", label: "Brand Scripts", count: counts.Copy, icon: Icons.Files },
  ];

  if (isLoading && !candidates) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-16 h-16 rounded-[24px] bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-center animate-pulse">
           <Icons.Activity className="w-8 h-8 text-brand-primary/20" />
        </div>
        <div className="text-center">
           <h3 className="text-lg font-black text-brand-primary tracking-normal lowercase">Synchronizing Neural Archives...</h3>
           <p className="text-sm text-slate-400 font-bold">Accessing candidate pools across all specialist agents.</p>
        </div>
      </div>
    );
  }

  if (!candidates) return null;

  // Flatten and filter candidates with explicit type mapping
  const allCandidates = [
    ...(candidates.video_synthesis || []).map(c => ({ ...c, type: c.type || "video_synthesis" })),
    ...(candidates.audio_mix || []).map(c => ({ ...c, type: c.type || "audio_mix" })),
    ...(candidates.image_scenes || []).map(c => ({ ...c, type: c.type || "image_scenes" })),
    ...(candidates.copy_script || []).map(c => ({ ...c, type: c.type || "copy_script" })),
    ...(candidates.producer_render || []).map(c => ({ ...c, type: c.type || "producer_render" })),
    ...(candidates.director_session || []).map(c => ({ ...c, type: c.type || "director_session" })),
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const displayedCandidates = activeFilter === "all" 
    ? allCandidates 
    : allCandidates.filter(c => {
        if (activeFilter === "video") {
          return ["Editor", "Producer", "Director", "video_synthesis", "producer_render", "director_session"].includes(c.type);
        }
        return c.type === activeFilter;
      });

  return (
    <div className="flex flex-col gap-10">
      {/* Category Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border whitespace-nowrap",
                activeFilter === f.id
                  ? "bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/10"
                  : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-brand-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{f.label}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[8px] font-black",
                activeFilter === f.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {displayedCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedCandidates.map((candidate) => (
            <CandidateCard 
              key={candidate.id}
              {...candidate}
              onAudit={onAudit}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[32px] py-20 flex flex-col items-center justify-center gap-4">
           <Icons.Filter className="w-10 h-10 text-slate-200" />
           <div className="text-center">
             <h3 className="text-[16px] font-black text-brand-primary tracking-normal lowercase">No candidates in this category_</h3>
             <p className="text-sm text-slate-400 font-bold">Try adjusting your filters or initiate new synthesis tasks.</p>
           </div>
        </div>
      )}
    </div>
  );
}
