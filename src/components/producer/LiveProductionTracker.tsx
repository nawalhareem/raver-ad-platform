"use client";

import React from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface PipelineStep {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  status: "done" | "running" | "pending";
  metadata?: string;
}

export function LiveProductionTracker({
  campaignId,
  status = "in_production",
  nodes = {},
  pipelineMessage = "Matrix Initialized"
}: any) {

  const getNodeStatus = (nodeKey: string): "done" | "running" | "pending" => {
    const node = nodes[nodeKey];
    if (!node) return "pending";

    if (node.status === "completed" || node.status === "success") return "done";
    if (node.status === "running" || node.status === "processing" || node.status === "started") return "running";
    return "pending";
  };

  const steps: PipelineStep[] = [
    { id: "image", label: "Visual Matrix Generation", icon: "Image", status: getNodeStatus("generate_image") },
    { id: "text", label: "Narrative Synthesis", icon: "Mic", status: getNodeStatus("generate_text") },
    { id: "voice", label: "Neural Voice Synthesis", icon: "AudioWave", status: getNodeStatus("generate_voice") },
    { id: "music", label: "Atmospheric Score", icon: "AudioWave", status: getNodeStatus("generate_music") },
    { id: "render", label: "Kling-Video Rendering", icon: "Video", status: getNodeStatus("render") },
    { id: "quality", label: "Final Quality Audit", icon: "Success", status: getNodeStatus("score_quality") },
  ];

  if (!campaignId) return (
    <div
      className="bg-white rounded-[32px] p-12 border border-slate-100 border-dashed flex flex-col items-center justify-center text-center gap-6 min-h-[460px] shadow-sm relative overflow-hidden"
    >
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-slate-50 to-transparent pointer-events-none" />
      <div className="relative">
        <div className="absolute inset-0 bg-slate-400/10 blur-2xl rounded-full scale-150 animate-pulse" />
        <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center relative border border-slate-100 shadow-xl shadow-slate-100/50">
          <Icons.Activity className="w-10 h-10 text-slate-200" />
        </div>
      </div>
      <div className="flex flex-col gap-2 max-w-[260px] relative z-10">
        <h3 className="text-xl font-black text-[#0A0A0A] tracking-normal lowercase leading-none">dormant production pipeline</h3>
        <p className="text-sm text-slate-400 font-bold leading-relaxed">Launch an orchestration brief to ignite the neural production thread.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-8 h-full relative overflow-hidden group">
      {/* Aesthetic mesh background elements */}
      <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-400/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-r from-brand-primary to-brand-secondary rounded-[16px] flex items-center justify-center shadow-xl shadow-brand-primary/10 relative">
            <div className="absolute inset-0 bg-white rounded-[16px] animate-pulse opacity-10" />
            <Icons.Activity className="w-6 h-6 text-white relative z-10" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-brand-primary">Production Pipeline</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{status}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-normal">campaign_id</span>
          <span className="text-[10px] font-mono font-black text-brand-primary truncate max-w-[100px]">{campaignId}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 pr-4 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Neural Thread</p>
          <span className="text-[10px] font-bold text-slate-400 italic">{pipelineMessage}</span>
        </div>

        <div className="flex flex-col gap-7 relative pl-1">
          {/* Neural Thread Line */}
          <div className="absolute left-[15.5px] top-4 bottom-4 w-px bg-slate-100 overflow-hidden">
            <div className="absolute inset-0 w-full h-[30%] bg-linear-to-b from-transparent via-blue-400 to-transparent animate-pulse" />
          </div>

          {steps.map((step, idx) => {
            const isRunning = step.status === "running";
            const isDone = step.status === "done";

            return (
              <div
                key={step.id}
                className="flex gap-5 relative z-10"
              >
                <div className="relative">
                  {/* Step Glow for running state */}
                  {isRunning && (
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-110" />
                  )}

                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-700 relative z-10 shadow-sm",
                      isDone ? "bg-white text-emerald-600 border border-emerald-100" :
                        isRunning ? "bg-white border-2 border-brand-primary text-brand-primary shadow-lg shadow-brand-primary/10" :
                          "bg-white border border-slate-100 text-slate-300"
                    )}
                  >
                    {isDone ? <Icons.Success className="w-4 h-4" /> :
                      isRunning ? <Icons.Loader className="w-4 h-4 animate-spin" /> :
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 pt-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[14px] font-bold tracking-tight transition-colors duration-500",
                        step.status === "pending" ? "text-slate-300" :
                          isRunning ? "text-brand-primary" : "text-brand-primary"
                      )}>{step.label}</span>
                      {isRunning && (
                        <span className="px-2 py-0.5 bg-slate-50 text-brand-primary text-[8px] font-black uppercase rounded-lg border border-slate-100 animate-pulse">
                          active
                        </span>
                      )}
                    </div>
                  </div>
                  {step.metadata && isRunning && (
                    <p className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-normal">{step.metadata}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-slate-50 relative z-10">
        <div className="bg-slate-50/50 rounded-[24px] p-6 flex flex-col gap-4 border border-slate-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Icons.PenLine className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Optimization Feedback</label>
          </div>
          <textarea
            placeholder="e.g. Enhance high-speed transitions..."
            className="w-full bg-transparent text-sm font-medium outline-none resize-none h-20 text-brand-primary placeholder:text-slate-300 leading-relaxed"
          ></textarea>
          <button
            className="w-full h-11 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-brand-primary/10 active:scale-95"
          >
            Update Production Thread
          </button>
        </div>
      </div>
    </div>
  );
}
