"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { VoiceSelector, VOICE_OPTIONS } from "./VoiceSelector";

interface AudioGeneratorProps {
  onGenerateMusic: (data: any) => void;
  onGenerateVoiceover: (data: any) => void;
  onProduceFull: (data: any) => void;
  isLoading: boolean;
  className?: string;
}

export function AudioGenerator({ 
  onGenerateMusic, 
  onGenerateVoiceover, 
  onProduceFull, 
  isLoading, 
  className 
}: AudioGeneratorProps) {
  const [activeTab, setActiveTab] = useState<"music" | "voiceover" | "full">("full");
  
  // Generic state for various forms
  const [formData, setFormData] = useState({
    businessName: "",
    productName: "",
    tone: "elegant",
    duration: 30,
    script: "",
    voice: VOICE_OPTIONS[0].id,
    voiceSpeed: 1.0,
    musicVolume: 0.2
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAction = () => {
    // Map the short mnemonic ID to the actual ElevenLabs voiceId
    const selectedVoiceOption = VOICE_OPTIONS.find(v => v.id === formData.voice);
    const effectiveVoiceId = selectedVoiceOption?.voiceId || formData.voice;

    if (activeTab === "music") {
      onGenerateMusic({
        tone: formData.tone,
        duration: formData.duration,
        brief: {
          business_name: formData.businessName,
          product_description: formData.productName
        }
      });
    } else if (activeTab === "voiceover") {
      onGenerateVoiceover({
        script: formData.script,
        voice: effectiveVoiceId,
        voice_speed: formData.voiceSpeed
      });
    } else {
      onProduceFull({
        brief: {
          business_name: formData.businessName,
          product_description: formData.productName
        },
        script: formData.script,
        tone: formData.tone,
        music_duration: formData.duration,
        voice: effectiveVoiceId,
        voice_speed: formData.voiceSpeed,
        music_volume: formData.musicVolume
      });
    }
  };

  const tabs = [
    { id: "music", label: "Atmospheric Music", icon: Icons.AudioWave },
    { id: "voiceover", label: "Neural Voiceover", icon: Icons.Mic },
    { id: "full", label: "Full Audio Package", icon: Icons.Shield },
  ];

  return (
    <div className={cn("bg-white border border-slate-100 rounded-[32px] p-6 sm:p-10 shadow-sm flex flex-col gap-10", className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-50 pb-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-50 rounded-[20px] flex items-center justify-center border border-slate-100 shadow-sm">
              <Icons.Activity className="w-6 h-6 text-brand-primary" />
           </div>
           <div className="flex flex-col">
              <h2 className="text-xl font-black text-brand-primary tracking-tighter lowercase leading-none">Neural Orchestration</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 shrink-0">Creative Parameters Input</span>
           </div>
        </div>

        <div className="flex bg-slate-50/80 p-1.5 rounded-[22px] border border-slate-100/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all active:scale-95",
                  activeTab === tab.id ? "bg-white text-brand-primary shadow-sm border border-slate-100/50" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-500" : "text-slate-300")} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {/* Form left col */}
        <div className="flex flex-col gap-8">
          {(activeTab === "music" || activeTab === "full") && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-1">Brand Identity</label>
                <input 
                  type="text"
                  placeholder="e.g. Glow Studio"
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-transparent rounded-[20px] px-6 text-sm font-bold text-brand-primary placeholder:text-slate-300 focus:bg-white focus:border-slate-100 transition-all outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-1">Product Archetype</label>
                <input 
                  type="text"
                  placeholder="e.g. matte lipstick"
                  value={formData.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-transparent rounded-[20px] px-6 text-sm font-bold text-brand-primary placeholder:text-slate-300 focus:bg-white focus:border-slate-100 transition-all outline-none"
                />
              </div>
            </>
          )}

          {(activeTab === "voiceover" || activeTab === "full") && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-1">Voiceover Script</label>
              <textarea 
                placeholder="Enter the spoken script... Use | to separate scenes."
                value={formData.script}
                onChange={(e) => updateField("script", e.target.value)}
                className="w-full min-h-[140px] bg-slate-50 border border-transparent rounded-[24px] p-6 text-sm font-medium text-brand-primary placeholder:text-slate-300 focus:bg-white focus:border-slate-100 transition-all outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multi-Scene Parsing Enabled</span>
              </div>
            </div>
          )}
        </div>

        {/* Form right col */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-8 bg-slate-50/50 p-8 rounded-[32px] border border-slate-50">
            {(activeTab === "music" || activeTab === "full") && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-1">Music Archetone</label>
                  <select 
                    value={formData.tone}
                    onChange={(e) => updateField("tone", e.target.value)}
                    className="w-full h-14 bg-white border border-slate-100 rounded-[20px] px-6 text-sm font-bold text-brand-primary transition-all outline-none active:scale-[0.98]"
                  >
                    <option value="elegant" className="text-slate-900 bg-white">Elegant & Sophisticated</option>
                    <option value="luxury" className="text-slate-900 bg-white">Luxury & Premium</option>
                    <option value="energetic" className="text-slate-900 bg-white">Energetic & Dynamic</option>
                    <option value="ambient" className="text-slate-900 bg-white">Ambient & Relaxing</option>
                    <option value="cinematic" className="text-slate-900 bg-white">Cinematic & Narrative</option>
                  </select>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Atmospheric Duration</label>
                    <span className="text-[11px] font-black text-blue-600 px-2 py-0.5 bg-blue-50 rounded-lg">{formData.duration}s</span>
                  </div>
                  <input 
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => updateField("duration", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>
              </div>
            )}

            {(activeTab === "voiceover" || activeTab === "full") && (
              <div className="flex flex-col gap-6">
                <VoiceSelector 
                  selectedVoice={formData.voice}
                  onSelect={(v) => updateField("voice", v)}
                />
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Synthetics Speed</label>
                    <span className="text-[11px] font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-lg">{formData.voiceSpeed.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range"
                    min="0.8"
                    max="2.0"
                    step="0.05"
                    value={formData.voiceSpeed}
                    onChange={(e) => updateField("voiceSpeed", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>
              </div>
            )}

            {activeTab === "full" && (
              <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between px-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Atmospheric Mix Volume</label>
                   <span className="text-[11px] font-black text-purple-600 px-2 py-0.5 bg-purple-50 rounded-lg">{Math.round(formData.musicVolume * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={formData.musicVolume}
                  onChange={(e) => updateField("musicVolume", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
              </div>
            )}
          </div>

          <button 
            onClick={handleAction}
            disabled={isLoading}
            className="w-full h-16 bg-linear-to-br from-brand-primary via-brand-primary to-brand-secondary text-white rounded-[24px] text-sm font-black uppercase tracking-[0.25em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-4 disabled:opacity-70 group"
          >
            {isLoading ? (
              <>
                <Icons.Loader className="w-5 h-5 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <Icons.Activity className="w-5 h-5 transition-transform group-hover:rotate-180 duration-700" />
                <span>Initiate Audio Synthesis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
