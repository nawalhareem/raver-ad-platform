"use client";

import { Icons } from "@/components/ui/icons";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { cn, normalizeAssetUrl } from "@/lib/utils";
import ImageViewerModal from "@/components/agents/ImageViewerModal";

interface Asset {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "graphic";
  createdAt?: string;
  fileSize?: string | number;
  dbId?: string;
  origin?: string;
  userId?: string;
  campaignId?: string;
  rawMetadata?: any;
}

interface AssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: Asset[]) => void;
  selectedAssets?: Asset[];
  onlyImages?: boolean;
}

export default function AssetSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedAssets = [],
  onlyImages = false
}: AssetSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tempSelected, setTempSelected] = useState<Asset[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string>("");

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef] = useState(typeof Audio !== "undefined" ? new Audio() : null);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
      setTempSelected(selectedAssets);
    } else {
      audioRef?.pause();
      setPlayingId(null);
    }
  }, [isOpen]);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await apiFetch(`${API_BASE}/assets`);
      if (response.ok) {
        const result = await response.json();
        setAssets(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioRef) {
      audioRef.onended = () => setPlayingId(null);
    }
    return () => {
      audioRef?.pause();
    };
  }, [audioRef]);

  if (!isOpen) return null;

  const togglePlay = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation();
    if (!audioRef) return;

    if (playingId === asset.id) {
      audioRef.pause();
      setPlayingId(null);
    } else {
      audioRef.src = normalizeAssetUrl(asset.url);
      audioRef.play();
      setPlayingId(asset.id);
    }
  };

  const toggleAsset = (asset: Asset) => {
    setTempSelected(prev =>
      prev.some(a => a.id === asset.id)
        ? prev.filter(a => a.id !== asset.id)
        : [...prev, asset]
    );
  };

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

  const categories = onlyImages ? ["All", "Images"] : ["All", "Images", "Videos", "Audio"];

  const filteredAssets = assets.filter(a => {
    // If onlyImages is true, force type image
    if (onlyImages && (a.type || "image").toLowerCase() !== "image") return false;

    const matchesCategory = activeCategory === "All" ||
      (a.type || "image").toLowerCase() === activeCategory.toLowerCase().replace(/s$/, "");
    const matchesSearch = (a.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-[700px] h-[80vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#121212]">Library Selection</h2>
              <p className="text-[14px] text-[#64748B]">Attach reference assets for neural production</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors cursor-pointer">
              <Icons.Plus className="w-5 h-5 rotate-45 text-[#64748B]" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 bg-[#F8FAFC] flex flex-col gap-4">
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[14px] focus:outline-none focus:border-[#02022C] transition-all"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all",
                    activeCategory === cat
                      ? "bg-[#02022C] text-white"
                      : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#02022C] hover:text-[#02022C]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-[#F8FAFC] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredAssets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredAssets.map((asset) => {
                  const isSelected = tempSelected.some(a => a.id === asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleAsset(asset)}
                      className={cn(
                        "group relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all",
                        isSelected ? "border-[#02022C] ring-2 ring-[#02022C]/10" : "border-[#F1F5F9] hover:border-[#02022C]/30"
                      )}
                    >
                      {asset.type === "video" ? (
                        <video src={normalizeAssetUrl(asset.url)} className="w-full h-full object-cover" />
                      ) : asset.type === "audio" ? (
                        <div className={cn(
                          "w-full h-full flex flex-col items-center justify-center transition-all duration-300",
                          playingId === asset.id ? "bg-[#02022C]/5" : "bg-[#F8FAFC]"
                        )}>
                          <div className="relative group/play flex flex-col items-center gap-2">
                            <button
                              onClick={(e) => togglePlay(e, asset)}
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90",
                                playingId === asset.id
                                  ? "bg-[#02022C] text-white animate-pulse"
                                  : "bg-white text-[#02022C] hover:bg-[#02022C] hover:text-white"
                              )}
                            >
                              {playingId === asset.id ? (
                                <Icons.Pause className="w-5 h-5" />
                              ) : (
                                <Icons.Play className="w-5 h-5 ml-1" />
                              )}
                            </button>
                            <span className="text-[10px] font-black text-[#02022C]/40 uppercase tracking-widest">
                              {playingId === asset.id ? "Playing..." : "Preview"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img src={normalizeAssetUrl(asset.url)} alt={asset.name} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPreviewImage(normalizeAssetUrl(asset.url));
                              setIsPreviewOpen(true);
                            }}
                            className="absolute top-2 left-2 w-7 h-7 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-white/40"
                            title="Preview Full Screen"
                          >
                            <Icons.Search className="w-3.5 h-3.5 text-white" />
                          </button>
                        </>
                      )}

                      {/* Overlay */}
                      <div className={cn(
                        "absolute inset-0 bg-black/20 transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )} />

                      {/* Selection Indicator */}
                      <div className={cn(
                        "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-[#02022C] border-[#02022C] text-white"
                          : "bg-white/40 border-white/60 text-transparent"
                      )}>
                        <Icons.CheckCircle className="w-4 h-4" />
                      </div>

                      {/* Metadata */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/60 to-transparent">
                        <p className="text-[10px] font-bold text-white uppercase truncate tracking-normal">{asset.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-50">
                <Icons.TemplatesLibrary className="w-12 h-12 text-[#94A3B8]" />
                <p className="text-[14px] font-bold text-[#64748B] uppercase tracking-widest">No matching assets found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-widest">
              {tempSelected.length} Assets Selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-[#475569] hover:bg-[#E2E8F0] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={tempSelected.length === 0}
                className="px-8 py-2.5 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-[14px] font-bold shadow-lg shadow-brand-primary/10 active:scale-95 disabled:opacity-50 transition-all"
              >
                Attach to Prompt
              </button>
            </div>
          </div>
        </div>
      </div>

      <ImageViewerModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={selectedPreviewImage}
      />
    </>
  );
}
