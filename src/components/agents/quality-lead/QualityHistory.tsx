"use client";

import React from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface QualityHistoryProps {
  history: any[];
  onViewReport: (report: any) => void;
  onDelete?: (id: string) => void;
}

export function QualityHistory({ history, onViewReport, onDelete }: QualityHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[32px] py-20 flex flex-col items-center justify-center gap-4">
        <Icons.Database className="w-10 h-10 text-slate-200" />
        <div className="text-center">
          <h3 className="text-[16px] font-black text-brand-primary tracking-normal lowercase">Neural history vault is empty_</h3>
          <p className="text-sm text-slate-400 font-bold">Initiate neural evaluations to populate the archival records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate & Identity</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Specialist</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Score</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Governance Decision</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Dimensions</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {history.map((record) => {
              const score = record.overallScore || record.metadata?.overall_score;
              const isRejected = record.decision === "rejected" || record.rejected;
              const candidate = record.candidate || record.metadata?.candidate || {};
              
              // Multi-Tier Specialist Resolution Engine
              const rawType = (candidate.agentType || candidate.type || record.type || "").toLowerCase();
              const campaignId = (record.campaignId || "").toLowerCase();
              
              let type = rawType;
              if (!type || type === "unknown") {
                if (campaignId.includes("audio")) type = "audio";
                else if (campaignId.includes("video") || campaignId.includes("producer") || campaignId.includes("editor")) type = "video";
                else if (campaignId.includes("image")) type = "image";
                else if (campaignId.includes("copy") || campaignId.includes("script")) type = "copy";
                else if (record.audioFitScore > 0) type = "audio";
                else if (record.visualScore > 0) type = "video";
                else type = "system_audit";
              }
              
              return (
                <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black text-brand-primary lowercase tracking-normal">
                          {candidate.label || record.campaignId || "Unlabeled Candidate"}
                        </span>
                        {candidate.id && (
                          <span className="text-[9px] font-bold text-slate-300 font-mono">
                            #{candidate.id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(record.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm",
                      type.toLowerCase().includes('audio') ? "bg-purple-500" :
                      type.toLowerCase().includes('video') || type.toLowerCase().includes('editor') || type.toLowerCase().includes('producer') ? "bg-blue-500" :
                      type.toLowerCase().includes('image') ? "bg-pink-500" :
                      type.toLowerCase().includes('copy') ? "bg-emerald-500" :
                      "bg-slate-400"
                    )}>
                      {type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "text-lg font-black",
                        (score || 0) > 0.8 ? "text-emerald-500" : (score || 0) > 0.5 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {score ? `${(score * 10).toFixed(1)}/10` : "0.0/10"}
                      </div>
                      <div className="flex-1 min-w-[40px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className={cn(
                             "h-full rounded-full transition-all duration-1000",
                             (score || 0) > 0.8 ? "bg-emerald-500" : (score || 0) > 0.5 ? "bg-amber-500" : "bg-rose-500"
                           )}
                           style={{ width: `${(score || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      isRejected ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    )}>
                      {record.decision?.replace("_", " ") || (isRejected ? "Rejected" : "Verified")}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold text-slate-400">
                    <div className="flex gap-4 items-center">
                       <div className="flex items-center gap-1.5" title="Visual Quality">
                         <Icons.Image className="w-3 h-3 text-blue-500"/> 
                         <span>{record.visualScore || record.metadata?.visual_score || 0}</span>
                       </div>
                       <div className="flex items-center gap-1.5" title="Brand Alignment">
                         <Icons.ShieldCheck className="w-3 h-3 text-emerald-500"/> 
                         <span>{record.brandAlignmentScore || record.metadata?.brand_alignment_score || 0}</span>
                       </div>
                       <div className="flex items-center gap-1.5" title="Copy Quality">
                         <Icons.Files className="w-3 h-3 text-purple-500"/> 
                         <span>{record.copyScore || record.metadata?.copy_score || 0}</span>
                       </div>
                       <div className="flex items-center gap-1.5" title="Audio Fit">
                         <Icons.Mic className="w-3 h-3 text-amber-500"/> 
                         <span>{record.audioFitScore || record.metadata?.audio_fit_score || 0}</span>
                       </div>
                       <div className="flex items-center gap-1.5" title="Platform Fit">
                         <Icons.Layout className="w-3 h-3 text-indigo-500"/> 
                         <span>{record.platformFitScore || record.metadata?.platform_fit_score || 0}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => {
                        if (record.candidate) {
                          onViewReport({
                            ...record.candidate,
                            type: record.candidate.agentType || record.candidate.type,
                            raw: {
                              ...(record.candidate.raw || record.candidate),
                              quality_report: record
                            }
                          });
                        } else {
                          onViewReport({ ...record, raw: record.metadata || record });
                        }
                      }}
                      className="px-4 py-2 bg-brand-primary text-white rounded-xl text-[9px] font-black uppercase tracking-normal hover:bg-brand-primary/80 transition-all active:scale-95"
                    >
                      View Report
                    </button>
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(record.id || record.reportId)}
                        className="ml-2 p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
