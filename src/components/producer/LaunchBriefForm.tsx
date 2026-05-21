"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { VoiceSelector, VOICE_OPTIONS } from "../agents/audio-lead/VoiceSelector";

interface Scene {
  id: string;
  visual_prompt: string;
}

interface LaunchBriefFormProps {
  onLaunch: (data: any) => void;
  isLoading: boolean;
}

export function LaunchBriefForm({ onLaunch, isLoading }: LaunchBriefFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mood, setMood] = useState("cinematic");
  const [platform, setPlatform] = useState("instagram");
  const [brandTone, setBrandTone] = useState("luxury");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [numScenes, setNumScenes] = useState(7);
  const [transition, setTransition] = useState("fade");
  const [musicVolume, setMusicVolume] = useState(0.2);
  const [voice, setVoice] = useState(VOICE_OPTIONS[0].id);
  const [videoModel, setVideoModel] = useState("kling-video");
  const [logoUrl, setLogoUrl] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  const isFormValid = businessName.trim() !== "" && 
                      productDescription.trim() !== "" && 
                      targetAudience.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    // Map short ID to ElevenLabs voiceId
    const selectedVoiceOption = VOICE_OPTIONS.find(v => v.id === voice);
    const effectiveVoiceId = selectedVoiceOption?.voiceId || voice;

    onLaunch({
      business_name: businessName,
      product_description: productDescription,
      target_audience: targetAudience,
      mood: mood,
      platform: platform,
      tone: brandTone,
      num_scenes: numScenes,
      voice: effectiveVoiceId,
      format: aspectRatio,
      video_model: videoModel,
      logo_url: logoUrl,
      voice_speed: voiceSpeed,
      transition: transition,
      music_volume: musicVolume
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* 🚀 Campaign Narrative Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <Icons.Rocket className="w-5 h-5 text-brand-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary">Campaign Narrative</h3>
           </div>
           
           <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Business Identity</label>
              <div className="relative group">
                <input 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Aura Fragrance"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary outline-none transition-all font-medium pr-12"
                />
                <Icons.Success className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 group-focus-within:text-brand-primary transition-colors" />
              </div>
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Product Description</label>
              <textarea 
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe the product essence..."
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary outline-none transition-all font-medium min-h-[100px] resize-none"
              />
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Target Audience</label>
              <input 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Gen-Z Lifestyle Enthusiasts"
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary outline-none transition-all font-medium"
              />
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Logo URL (Optional)</label>
              <div className="relative group">
                <input 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://your-brand-asset.png"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary outline-none transition-all font-medium"
                />
              </div>
           </div>
        </div>

        {/* 🎨 Aesthetic Parameters */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <Icons.MagicWand className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-[#02022C]">Visual Matrix</h3>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Universal Mood</label>
                <select 
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary outline-none font-medium appearance-none cursor-pointer"
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="dynamic">Dynamic</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Brand Tone</label>
                <select 
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary outline-none font-medium appearance-none cursor-pointer"
                >
                  <option value="bold">Bold & High Energy</option>
                  <option value="minimal">Quiet Luxury</option>
                  <option value="friendly">Engaging / Friendly</option>
                </select>
              </div>
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Deployment Format</label>
              <div className="grid grid-cols-3 gap-3">
                 {["16:9", "9:16", "1:1"].map((format) => (
                   <button
                     key={format}
                     type="button"
                     onClick={() => setAspectRatio(format)}
                     className={cn(
                       "py-2 rounded-lg text-xs font-black transition-all border",
                       aspectRatio === format 
                        ? "bg-linear-to-r from-brand-primary to-brand-secondary text-white border-brand-primary" 
                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                     )}
                   >
                     {format}
                   </button>
                 ))}
              </div>
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Social Platform Logic</label>
              <div className="flex gap-2">
                {[
                  { id: "instagram", icon: Icons.Instagram },
                  { id: "tiktok", icon: Icons.Tiktok },
                  { id: "youtube", icon: Icons.Youtube },
                  { id: "facebook", icon: Icons.Facebook }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border transition-all flex items-center justify-center",
                      platform === p.id 
                        ? "bg-white border-brand-primary text-brand-primary shadow-sm" 
                        : "bg-slate-100 border-transparent text-slate-400"
                    )}
                  >
                    <p.icon className={cn("w-4 h-4")} />
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* ⚙️ Advanced Orchestration Logic */}
      <div className="bg-linear-to-r from-brand-primary to-brand-secondary rounded-[32px] p-8 border border-white/5 shadow-2xl flex flex-col gap-8 relative group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/20 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
         
         <div className="flex items-center justify-between border-b border-white/10 pb-6 relative z-10">
            <div className="flex items-center gap-3">
               <Icons.Mic className="w-5 h-5 text-white" />
               <h3 className="text-sm font-black uppercase tracking-widest text-white">Neural Configuration</h3>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
               <span className="text-xs font-black uppercase tracking-widest text-white/60">Kling AI Engine</span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 relative z-20">
            <div className="flex flex-col gap-3">
               <label className="text-xs font-black uppercase tracking-widest text-white/40">Scene Matrix Length</label>
               <input 
                 type="range"
                 min="1"
                 max="12"
                 step="1"
                 value={numScenes}
                 onChange={(e) => setNumScenes(parseInt(e.target.value))}
                 className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
               />
               <div className="flex justify-between text-xs font-black text-white/60 uppercase">
                 <span>1 Scene</span>
                 <span className="text-white">{numScenes} Scenes Matrix</span>
               </div>
            </div>

            <div className="flex flex-col gap-3 min-h-[100px]">
               <label className="text-xs font-black uppercase tracking-widest text-white/40 px-1">Neural Voice Library Selection</label>
               <VoiceSelector 
                 selectedVoice={voice}
                 onSelect={(v) => setVoice(v)}
                 className="no-label"
                 isDark
               />
               <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mt-2 ml-1 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                 Active: <span className="text-white/80">{VOICE_OPTIONS.find(v => v.id === voice)?.name || "Neural Selection"}</span>
               </p>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-xs font-black uppercase tracking-widest text-white/40">Synthesis Engine Selection</label>
               <select
                 value={videoModel}
                 onChange={(e) => setVideoModel(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-white/10 transition-colors"
               >
                 <option value="kling-video" className="bg-linear-to-r from-brand-primary to-brand-secondary">Kling-Video-Neo</option>
                 <option value="seedance" className="bg-linear-to-r from-brand-primary to-brand-secondary">Seedance Synthesis</option>
                 <option value="ltx-video" className="bg-linear-to-r from-brand-primary to-brand-secondary">LTX-High-Fidelity</option>
               </select>
            </div>
         </div>

         {/* 🎚️ Audio & Cinematic Matrix */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 relative z-10 pt-10 border-t border-white/10 mt-6">
            <div className="flex flex-col gap-3">
               <label className="text-xs font-black uppercase tracking-widest text-white/40">Voice Speed Dynamics</label>
               <input 
                 type="range"
                 min="0.80"
                 max="2.00"
                 step="0.05"
                 value={voiceSpeed}
                 onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                 className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
               />
               <div className="flex justify-between text-xs font-black text-white/60 uppercase">
                 <span>0.80x</span>
                 <span className="text-white">{voiceSpeed.toFixed(2)}x Dynamic</span>
                 <span>2.00x</span>
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-xs font-black uppercase tracking-widest text-white/40">Cinematic Transitions</label>
               <div className="flex flex-wrap gap-2">
                 {["fade", "dissolve", "slideright", "slideleft", "none"].map((t) => (
                   <button
                     key={t}
                     type="button"
                     onClick={() => setTransition(t)}
                     className={cn(
                       "px-3 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all border shrink-0",
                       transition === t 
                         ? "bg-white text-brand-primary border-white shadow-lg" 
                         : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                     )}
                   >
                     {t === "slideright" ? "Slide Right" : t === "slideleft" ? "Slide Left" : t}
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-xs font-black uppercase tracking-widest text-white/40">Neural Audio Levels</label>
               <input 
                 type="range"
                 min="0.05"
                 max="0.50"
                 step="0.01"
                 value={musicVolume}
                 onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                 className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
               />
               <div className="flex justify-between text-xs font-black text-white/60 uppercase">
                 <span>Min</span>
                 <span className="text-white">Music: {(musicVolume * 100).toFixed(0)}%</span>
                 <span>Max</span>
               </div>
            </div>
         </div>

         <button 
           type="submit"
           disabled={isLoading || !isFormValid}
           className={cn(
             "w-full h-16 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all duration-500 shadow-xl flex items-center justify-center gap-4 relative z-10",
             (isLoading || !isFormValid)
               ? "bg-white/5 text-white/20 cursor-not-allowed border-white/5"
               : "bg-white text-brand-primary border hover:border-white hover:bg-linear-to-r hover:from-brand-primary hover:to-brand-secondary hover:text-white shadow-black/20 active:scale-[0.98]"
           )}
         >
           {isLoading ? (
             <Icons.Loader className="w-6 h-6 animate-spin" />
           ) : (
             <>
               <Icons.Rocket className="w-5 h-5" />
               Generate Production Sequence
             </>
           )}
         </button>
      </div>
    </form>
  );
}
