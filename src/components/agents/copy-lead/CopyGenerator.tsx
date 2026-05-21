"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface CopyGeneratorProps {
  onGenerate: (type: string, data: any) => void;
  isLoading: boolean;
}

const PLATFORMS = ["instagram", "tiktok", "facebook", "youtube", "linkedin"];
const TONES = ["elegant", "energetic", "professional", "minimalist", "bold", "luxury"];

export function CopyGenerator({ onGenerate, isLoading }: CopyGeneratorProps) {
  const [activeTab, setActiveTab] = useState("package");
  const [formData, setFormData] = useState({
    businessName: "",
    product: "",
    audience: "",
    tone: "elegant",
    duration: "3",
    platform: "instagram",
    context: "",
    hashtagCount: "15",
    scenes: ["", "", "", "", "", "", ""]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSceneChange = (index: number, value: string) => {
    const newScenes = [...formData.scenes];
    newScenes[index] = value;
    setFormData(prev => ({ ...prev, scenes: newScenes }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(activeTab, formData);
  };

  const tabs = [
    { id: "package", label: "Full Package", icon: Icons.MagicWand, color: "text-purple-500" },
    { id: "script", label: "Script", icon: Icons.Mic, color: "text-blue-500" },
    { id: "caption", label: "Caption", icon: Icons.Text, color: "text-emerald-500" },
    { id: "overlays", label: "Overlays", icon: Icons.AIAgents, color: "text-orange-500" },
    { id: "cta", label: "CTA", icon: Icons.ArrowRight, color: "text-pink-500" },
    { id: "hashtags", label: "Hashtags", icon: Icons.Plus, color: "text-indigo-500" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-50 p-2 sm:p-3 bg-slate-50/30 backdrop-blur-md overflow-x-auto scrollbar-hide">
        <div className="flex w-full min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-3 sm:px-2 rounded-2xl sm:rounded-3xl transition-all duration-500 min-w-[80px] sm:min-w-0",
                  activeTab === tab.id
                    ? "bg-white text-brand-primary shadow-xl shadow-blue-900/5 border border-slate-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500",
                  activeTab === tab.id ? "bg-slate-50 border border-slate-100" : "bg-transparent"
                )}>
                  <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", activeTab === tab.id ? tab.color : "text-slate-300")} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-10 scrollbar-hide">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Brand / Business Name</label>
              <div className="relative group/input">
                <input
                  type="text"
                  placeholder="e.g. Glow Studio"
                  className="w-full h-14 sm:h-16 bg-slate-50/50 border border-slate-100 rounded-xl sm:rounded-[24px] px-5 sm:px-6 text-[12px] sm:text-[13px] font-bold focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Product / Service</label>
              <div className="relative group/input">
                <input
                  type="text"
                  placeholder="e.g. matte lipstick collection"
                  className="w-full h-14 sm:h-16 bg-slate-50/50 border border-slate-100 rounded-xl sm:rounded-[24px] px-5 sm:px-6 text-[12px] sm:text-[13px] font-bold focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                  value={formData.product}
                  onChange={(e) => handleInputChange("product", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Target Audience</label>
            <input
              type="text"
              placeholder="e.g. women 25–40 into skincare"
              className="w-full h-14 sm:h-16 bg-slate-50/50 border border-slate-100 rounded-xl sm:rounded-[24px] px-5 sm:px-6 text-[12px] sm:text-[13px] font-bold focus:bg-white focus:border-brand-primary transition-all outline-none"
              value={formData.audience}
              onChange={(e) => handleInputChange("audience", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Brand Voice / Tone</label>
              <div className="relative">
                <select
                  className="w-full h-14 sm:h-16 bg-slate-50/50 border border-slate-100 rounded-xl sm:rounded-[24px] px-5 sm:px-6 text-[12px] sm:text-[13px] font-bold text-slate-900 focus:bg-white focus:border-brand-primary transition-all outline-none appearance-none cursor-pointer"
                  value={formData.tone}
                  onChange={(e) => handleInputChange("tone", e.target.value)}
                >
                  {TONES.map(t => (
                    <option key={t} value={t} className="text-slate-900 bg-white">{t}</option>
                  ))}
                </select>
                <Icons.ChevronDown className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>
            
            {(activeTab === "package" || activeTab === "script") && (
              <div className="space-y-2 sm:space-y-3 bg-slate-50/50 p-5 sm:p-6 rounded-2xl sm:rounded-[28px] border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Duration per scene (sec)</label>
                  <span className="font-black text-brand-primary text-[10px] sm:text-xs px-2 py-0.5 bg-white rounded-lg border border-slate-100">{formData.duration}s</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                />
              </div>
            )}

            {(activeTab === "package" || activeTab === "caption" || activeTab === "cta" || activeTab === "hashtags") && (
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Platform</label>
                <div className="relative">
                  <select
                    className="w-full h-14 sm:h-16 bg-slate-50/50 border border-slate-100 rounded-xl sm:rounded-[24px] px-5 sm:px-6 text-[12px] sm:text-[13px] font-bold text-slate-900 focus:bg-white focus:border-brand-primary transition-all outline-none appearance-none cursor-pointer"
                    value={formData.platform}
                    onChange={(e) => handleInputChange("platform", e.target.value)}
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p} className="text-slate-900 bg-white">{p}</option>
                    ))}
                  </select>
                  <Icons.ChevronDown className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {activeTab === "hashtags" && (
             <div className="space-y-3 bg-linear-to-r from-brand-primary to-brand-secondary  p-6 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-xl shadow-brand-primary/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Number of hashtags</label>
                  <span className="font-black text-white text-[10px] sm:text-xs px-3 py-1 bg-white/10 rounded-xl border border-white/5">#{formData.hashtagCount}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                  value={formData.hashtagCount}
                  onChange={(e) => handleInputChange("hashtagCount", e.target.value)}
                />
              </div>
          )}

          {activeTab === "caption" && (
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Campaign context (optional)</label>
              <textarea
                placeholder="e.g. Summer glow launch, limited time offer"
                className="w-full h-24 sm:h-32 bg-slate-50/50 border border-slate-100 rounded-2xl sm:rounded-[28px] p-5 sm:p-6 text-[12px] sm:text-[13px] font-bold focus:bg-white focus:border-brand-primary transition-all outline-none resize-none"
                value={formData.context}
                onChange={(e) => handleInputChange("context", e.target.value)}
              />
            </div>
          )}

          {(activeTab !== "caption" && activeTab !== "cta" && activeTab !== "hashtags") && (
            <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">Scene Orchestration</label>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Tailor your scene-by-scene creative brief</p>
                </div>
                <span className="text-xs font-black text-blue-600 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full uppercase italic self-start sm:self-auto">7 Active Scenes</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {formData.scenes.map((scene, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 group-focus-within:bg-linear-to-r from-brand-primary to-brand-secondary  group-focus-within:text-white group-focus-within:border-brand-primary transition-all duration-500 shadow-sm">
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      placeholder={`Briefing for Scene ${idx+1}...`}
                      className="w-full h-12 sm:h-14 bg-slate-50/20 border border-slate-100/50 rounded-xl sm:rounded-[20px] pl-14 sm:pl-16 pr-5 sm:pr-6 text-[11px] sm:text-[12px] font-bold focus:bg-white focus:border-brand-primary transition-all outline-none focus:shadow-lg focus:shadow-blue-900/5"
                      value={scene}
                      onChange={(e) => handleSceneChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 sm:pt-10">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-16 sm:h-20 rounded-[20px] sm:rounded-[28px] flex items-center justify-center gap-3 sm:gap-4 transition-all duration-500 active:scale-[0.98] shadow-2xl relative overflow-hidden group/btn",
                isLoading 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-linear-to-r from-brand-primary to-brand-secondary text-white hover:bg-black shadow-blue-900/20"
              )}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              {isLoading ? (
                <>
                  <Icons.Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1 sm:ml-2">Engine Initializing...</span>
                </>
              ) : (
                <>
                    <Icons.whiteMagicWand className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Synthesize Neural Copy</span>
                </>
              )}
            </button>
            <div className="flex flex-col items-center gap-2 mt-4 sm:mt-6">
              <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Autonomous Creative Asset Generation</p>
              <div className="h-0.5 w-10 sm:w-12 bg-slate-100 rounded-full" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
