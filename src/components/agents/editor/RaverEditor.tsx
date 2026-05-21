"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface Scene {
  scene_id: number;
  image_url: string;
  overlay_text?: string;
  visual_prompt?: string;
  duration: number;
}

interface VideoGeneratorProps {
  onGenerate: (data: any) => void;
  isLoading: boolean;
}

export function RaverEditor({ onGenerate, isLoading }: VideoGeneratorProps) {
  const [activeTab, setActiveTab] = useState<"render" | "export">("render");
  const [format, setFormat] = useState("16:9");
  const [numScenes, setNumScenes] = useState(7);
  const [scenes, setScenes] = useState<Scene[]>(
    Array(7).fill(null).map((_, i) => ({
      scene_id: i,
      image_url: "",
      overlay_text: "",
      visual_prompt: "",
      duration: 5
    }))
  );

  // Global Settings
  const [voiceoverUrl, setVoiceoverUrl] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [business_name, setBusinessName] = useState("");
  const [logo_url, setLogoUrl] = useState("");
  const [transition, setTransition] = useState("fade");
  const [transition_duration, setTransitionDuration] = useState(0.2);
  const [video_model, setVideoModel] = useState("kling-video");
  const [animate_scenes, setAnimateScenes] = useState(false);

  const handleSceneChange = (index: number, field: keyof Scene, value: any) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], [field]: value };
    setScenes(updated);
  };

  const currentScenes = scenes.slice(0, numScenes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      mode: activeTab,
      format: format,
      scenes: currentScenes,
      voiceover_url: voiceoverUrl,
      music_url: musicUrl,
      music_volume: musicVolume,
      business_name: business_name,
      logo_url: logo_url,
      transition,
      transition_duration: transition_duration,
      animate_scenes,
      video_model: video_model
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs */}
      <div className="flex bg-[#F1F5F9]/50 p-1.5 rounded-[18px] w-fit border border-[#F1F5F9]">
        <button
          onClick={() => setActiveTab("render")}
          type="button"
          className={cn(
            "px-6 py-2.5 rounded-[14px] text-sm font-black uppercase tracking-widest transition-all",
            activeTab === "render" 
              ? "bg-linear-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/10" 
              : "text-[#64748B] hover:text-brand-primary"
          )}
        >
          Render Campaign Video
        </button>
        <button
          onClick={() => setActiveTab("export")}
          type="button"
          className={cn(
            "px-6 py-2.5 rounded-[14px] text-sm font-black uppercase tracking-widest transition-all",
            activeTab === "export" 
              ? "bg-linear-to-r from-brand-primary to-brand-secondary  text-white shadow-lg shadow-brand-primary/10" 
              : "text-[#64748B] hover:text-brand-primary"
          )}
        >
          Export All Formats
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Config */}
          <div className="lg:col-span-8 space-y-10">
            {activeTab === "render" && (
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Icons.Monitor className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Output Format</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "16:9", label: "16:9", sub: "YouTube / LinkedIn" },
                    { id: "9:16", label: "9:16", sub: "Reels / TikTok" },
                    { id: "1:1", label: "1:1", sub: "Instagram Feed" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        "p-6 rounded-[24px] border transition-all text-left group",
                        format === f.id 
                          ? "border-brand-primary bg-linear-to-r from-brand-primary to-brand-secondary  text-white shadow-xl" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <div className="text-xl font-black">{f.label}</div>
                      <div className={cn("text-xs font-bold uppercase tracking-widest mt-1", format === f.id ? "text-white/60" : "text-slate-400")}>
                        {f.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "export" && (
              <div className="bg-linear-to-r from-brand-primary to-brand-secondary  rounded-[32px] p-8 text-white space-y-2">
                <div className="text-xl font-black tracking-tight">Bulk Render Mode Active</div>
                <p className="text-blue-100 text-sm font-medium">RENDERS 9:16 + 1:1 + 16:9 SIMULTANEOUSLY FROM THE SAME SCENES.</p>
              </div>
            )}

            {/* SceneMatrix */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Icons.Film className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Raver Scene Matrix</h3>
                </div>
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Scenes</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="7" 
                    value={numScenes}
                    onChange={(e) => setNumScenes(parseInt(e.target.value))}
                    className="w-24 accent-brand-primary"
                  />
                  <span className="text-[14px] font-black text-brand-primary w-4">{numScenes}</span>
                </div>
              </div>

              <div className="space-y-4">
                {currentScenes.map((scene, idx) => (
                  <div key={idx} className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center justify-between">
                       <span className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-black text-slate-400 border border-slate-100 uppercase tracking-widest">
                         Scene {idx + 1}
                       </span>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Duration</span>
                          <input 
                            type="number" 
                            value={scene.duration}
                            onChange={(e) => handleSceneChange(idx, "duration", parseInt(e.target.value))}
                            className="w-12 h-8 bg-slate-50 border border-slate-100 rounded-lg text-center text-sm font-black outline-none focus:border-slate-300"
                          />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Sec</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Composition Source (Image URL)</label>
                         <input 
                           type="text"
                           placeholder="Paste URL from Image Lead..."
                           value={scene.image_url}
                           onChange={(e) => handleSceneChange(idx, "image_url", e.target.value)}
                           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Overlay Text (Optional)</label>
                         <input 
                           type="text"
                           placeholder="e.g. Your glow starts here..."
                           value={scene.overlay_text}
                           onChange={(e) => handleSceneChange(idx, "overlay_text", e.target.value)}
                           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                         />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Visual Direction / Prompt</label>
                       <textarea 
                         placeholder="Describe the cinematic motion or specific visual details for this scene..."
                         value={scene.visual_prompt}
                         onChange={(e) => handleSceneChange(idx, "visual_prompt", e.target.value)}
                         className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none"
                       />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Global Sidebar Config */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-linear-to-r from-brand-primary to-brand-secondary rounded-[32px] p-8 text-white space-y-8 sticky top-6">
              <div className="flex items-center gap-3">
                <Icons.Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/60">Global Controls</h3>
              </div>

              <div className="space-y-6">
                {/* Audio Sync */}
                <div className="space-y-4">
                  <div className="text-xs font-black uppercase tracking-widest text-blue-400/80">Audio Synchronization</div>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Voiceover URL (.mp3)"
                      value={voiceoverUrl}
                      onChange={(e) => setVoiceoverUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-all font-medium"
                    />
                    <input 
                      type="text" 
                      placeholder="Background Music URL (.mp3)"
                      value={musicUrl}
                      onChange={(e) => setMusicUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Branding Controls */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="text-xs font-black uppercase tracking-widest text-pink-400/80">Brand Identity</div>
                   <div className="space-y-2">
                     <input 
                       type="text" 
                       placeholder="Business Name"
                       value={business_name}
                       onChange={(e) => setBusinessName(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-all font-medium"
                     />
                     <input 
                       type="text" 
                       placeholder="Logo URL (.png)"
                       value={logo_url}
                       onChange={(e) => setLogoUrl(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-all font-medium"
                     />
                   </div>
                </div>

                 {/* Cinematic Style Controls */}
                 <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="text-xs font-black uppercase tracking-widest text-emerald-400/80">Cinematic Style</div>
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Animate Scenes</span>
                        <span className="text-xs text-white/40">Apply dynamic camera motion</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAnimateScenes(!animate_scenes)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all duration-300",
                          animate_scenes ? "bg-emerald-500" : "bg-white/10"
                        )}
                      >
                         <div className={cn(
                           "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                           animate_scenes ? "left-6" : "left-1"
                         )} />
                      </button>
                   </div>
                 </div>

                 {/* Transitions */}
                 <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="text-xs font-black uppercase tracking-widest text-purple-400/80">Cinematic Transitions</div>
                   <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={transition}
                        onChange={(e) => setTransition(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition-all font-medium appearance-none"
                      >
                        <option value="fade" className="text-slate-900 bg-white">Cross Fade</option>
                        <option value="dissolve" className="text-slate-900 bg-white">Film Dissolve</option>
                        <option value="none" className="text-slate-900 bg-white">Cut (None)</option>
                      </select>
                     <input 
                        type="number"
                        step="0.1"
                        value={transition_duration}
                        onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-all font-medium"
                        placeholder="Duration"
                     />
                   </div>
                 </div>

                {/* Engine Settings */}
                 <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="text-xs font-black uppercase tracking-widest text-amber-400/80">Animation Engine</div>
                    <select 
                      value={video_model}
                      onChange={(e) => setVideoModel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition-all font-medium appearance-none"
                    >
                      <option value="kling-video" className="text-slate-900 bg-white">Kling Video (Recommended)</option>
                      <option value="luma-dream" className="text-slate-900 bg-white">Luma Dream Machine</option>
                      <option value="runway-gen3" className="text-slate-900 bg-white">Runway Gen-3 Alpha</option>
                    </select>
                 </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-linear-to-r from-brand-primary to-brand-secondary rounded-[24px] text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Icons.Loader className="w-4 h-4 animate-spin" />
                      Initializing Render...
                    </>
                  ) : (
                    <>
                      <Icons.Rocket className="w-4 h-4" />
                      Orchestrate Synthesis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
