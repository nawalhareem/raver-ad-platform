"use client";

import React from "react";
import { Icons } from "@/components/ui/icons";
import { RaverEditor } from "./RaverEditor";

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: any) => void;
  isLoading: boolean;
}

export function EditorModal({ isOpen, onClose, onGenerate, isLoading }: EditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-100 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[1200px] h-[90vh] bg-[#F8FAFC] rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-r from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/10">
              <Icons.Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-brand-primary tracking-normal lowercase leading-tight">Initiate Neural Synthesis</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Orchestrating Platform-Ready Visual Campaigns</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-slate-100 transition-all active:scale-90"
          >
            <Icons.Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1000px] mx-auto pb-10">
            <RaverEditor onGenerate={onGenerate} isLoading={isLoading} />
          </div>
        </div>

        {/* Footer Overlay Shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-[#F8FAFC] to-transparent pointer-events-none" />
      </div>

    </div>
  );
}
