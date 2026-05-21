"use client";

import React from "react";
import Image from "next/image";
import { Icons } from "@/components/ui/icons";

interface Agent {
  name: string;
  role: string;
  description: string;
  tasksCompleted: number;
  imagePath: string;
  isAudio?: boolean;
}

interface AgentModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

export default function AgentModal({ agent, isOpen, onClose, onAction }: AgentModalProps) {
  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[541px] h-fit max-h-[95vh] p-3 sm:p-4 rounded-[32px] flex flex-col overflow-hidden gap-3 sm:gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        {/* Top Image Section */}
        <div className="relative w-full h-[200px] sm:h-[240px] bg-[#F8F8F8] flex items-center justify-center p-3 sm:p-4 rounded-[24px] shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition-all border border-slate-100 group"
          >
            <Icons.Plus className="w-5 h-5 rotate-45 text-slate-400 group-hover:text-brand-primary" />
          </button>
          
          <div className="w-full h-full relative">
            <Image 
              src={agent.imagePath} 
              alt={agent.name}
              fill
              className="object-contain p-4 sm:p-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/400x300?text=Avatar";
              }}
            />
          </div>
          
          {agent.isAudio && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-slate-100">
                <Icons.AudioWave className="w-5 h-5 text-brand-primary" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[22px] sm:text-[24px] font-black text-brand-primary tracking-normal lowercase">{agent.name}</h2>
              <span className="text-[12px] sm:text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-none">{agent.role}</span>
            </div>

            <div className="bg-slate-50 p-5 rounded-[20px] border border-slate-100/50">
              <p className="text-[13px] sm:text-[14px] text-[#121212] font-medium leading-relaxed italic opacity-90">
                "{agent.description}"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                <span className="text-[14px] sm:text-[16px] font-bold text-brand-primary">Active Orchestration</span>
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Completed</span>
                <span className="text-[14px] sm:text-[16px] font-bold text-brand-primary">{agent.tasksCompleted.toLocaleString()} Tasks</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1 relative overflow-hidden group/feat">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-r from-brand-primary to-brand-secondary  group-hover/feat:w-1.5 transition-all"></div>
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Strategic Edge</span>
              <span className="text-[13px] sm:text-[14px] font-bold text-brand-primary">Precision-tuned neural architecture in established brand context.</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onAction}
          className="w-full h-14 shrink-0 bg-linear-to-r from-brand-primary to-brand-secondary  text-white rounded-[16px] text-[13px] sm:text-[14px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/10 active:scale-95 group/btn border border-white/5"
        >
          <span>Start Synthesis with {agent.name.split(' ').pop()}</span>
          <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
