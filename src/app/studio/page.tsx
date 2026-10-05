"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StudioHero from "@/components/studio/StudioHero";
import CampaignSelectionModal from "@/components/studio/CampaignSelectionModal";
import ProjectCard from "@/components/dashboard/ProjectCard";
import ProductionPipeline from "@/components/studio/ProductionPipeline";
import CreateCampaignModal from "@/components/studio/CreateCampaignModal";
import CampaignPreviewModal from "@/components/studio/CampaignPreviewModal";
import AIResponseModal from "@/components/studio/AIResponseModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";
import { Icons } from "@/components/ui/icons";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { cn, enrichMessageWithCampaign, formatFileSize } from "@/lib/utils";
import { toast } from "react-toastify";

/*
### Custom Icon Integration
- Added `Sent` and `Mic` icons to [custom-icons.tsx](file:///Users/muhammadmaaz/Documents/GitHub/Ravi%20AI%20Frontend/src/components/ui/custom-icons.tsx).
- Added `Success` icon (based on `Icon.svg`) to [custom-icons.tsx](file:///Users/muhammadmaaz/Documents/GitHub/Ravi%20AI%20Frontend/src/components/ui/custom-icons.tsx), which is a green circular checkmark asset.
- Updated [icons.tsx](file:///Users/muhammadmaaz/Documents/GitHub/Ravi%20AI%20Frontend/src/components/ui/icons.tsx) to map `Icons.Success` to this new custom asset.
- These icons are automatically available for use throughout the application.
*/

interface Campaign {
  id?: string;
  title: string;
  status: string;
  image: string | string[];
  sessionId?: string;
  videoUrl?: string | null;
  voiceoverUrl?: string | null;
  musicUrl?: string | null;
  script?: string | null;
  message?: string;
  audience?: string;
  objective?: string;
  format?: string;
  duration?: string;
  colorScheme?: string;
  platforms?: string[];
  tones?: string[];
  visualStyles?: string[];
  createdAt?: string;
  history?: { role: string; content: string; assets?: any[] }[] | null;
  prompt?: string | null;
  completed_nodes?: string[];
  voice?: string | null;
  campaign_status?: string | null;
  hitl?: any;
  step_approvals?: any;
}

function StudioLoadingState() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4">
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 border-[2.5px] border-slate-100 border-t-brand-primary rounded-full animate-spin duration-[1.5s]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-linear-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Icons.Loader className="w-6 h-6 text-white animate-spin duration-[2s]" />
            </div>
          </div>
          <div className="absolute w-32 h-32 border border-brand-primary/10 rounded-full animate-ping opacity-30"></div>
        </div>
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <h3 className="text-[22px] font-bold tracking-tight bg-linear-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Initializing Studio
          </h3>
          <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
            Synchronizing your latest campaigns and preparing the AI production pipeline...
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ActiveCampaignsGrid({ campaigns, onDelete, onViewMore, onViewDetails, activeIndex, onSelect, onRefresh }: any) {
  return (
    <div className="flex flex-col gap-[16px] bg-[#FFFFFF] border-[0.35px] border-[#0000001A] rounded-[12px] p-[16px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-[#121212]">Active Campaigns</h2>
        <button
          onClick={onViewMore}
          className="px-3 py-1.5 rounded-lg text-[13px] font-bold text-[#121212] transition-all flex items-center gap-1.5 group hover:bg-linear-to-r hover:from-brand-primary hover:to-brand-secondary hover:text-white active:scale-95"
        >
          View More
          <Icons.ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
        {campaigns.length > 0 ? (
          campaigns.slice(0, 3).map((campaign: any, i: number) => {
            const createdAt = campaign.createdAt ? new Date(campaign.createdAt) : new Date();
            const diffTime = Math.abs(new Date().getTime() - createdAt.getTime());
            const hours = Math.floor(diffTime / (1000 * 60 * 60));
            const timeStr = hours > 24 ? `${Math.floor(hours / 24)}d` : hours < 1 ? "now" : `${hours}h`;

            return (
              <ProjectCard
                key={campaign.sessionId || campaign.id || i}
                title={campaign.title}
                image={campaign.image}
                status={campaign.status}
                campaignStatus={campaign.campaign_status}
                message={campaign.message}
                videoUrl={campaign.videoUrl}
                musicUrl={campaign.musicUrl}
                time={timeStr}
                description={campaign.script || campaign.message || ""}
                isSelected={i === activeIndex}
                onClick={() => onSelect(i)}
                onPreview={() => onViewDetails(campaign)}
                onDelete={() => onDelete(campaign)}
              />
            );
          })
        ) : (
          <div className="col-span-full h-[150px] flex flex-col items-center justify-center bg-[#F8FAFC] border border-dashed border-slate-200 rounded-[12px] gap-2">
            <Icons.Activity className="w-8 h-8 text-slate-300" />
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">No active campaigns right now</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignInsights({ insights }: any) {
  return (
    <div className="flex flex-col gap-4 bg-[#FFFFFF] border-[0.35px] border-[#0000001A] rounded-[12px] p-[16px]">
      <h2 className="text-[18px] font-bold text-[#121212]">Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight: any, i: number) => {
          // Parse value to ensure it isn't negative if it's a number or contains a negative number
          let displayValue = insight.value;
          if (typeof displayValue === "number") {
            displayValue = Math.max(0, displayValue);
          } else if (typeof displayValue === "string") {
            const trimmed = displayValue.trim();
            const negativeMatch = trimmed.match(/-\s*([$€£¥]?\s*\d+(?:\.\d+)?)/);
            if (negativeMatch) {
              const currency = negativeMatch[1].match(/[$€£¥]/)?.[0] || "";
              displayValue = trimmed.replace(negativeMatch[0], currency + "0");
            } else if (!isNaN(Number(trimmed))) {
              displayValue = Math.max(0, Number(trimmed)).toString();
            }
          }

          const hasPlus = insight.change?.includes("+");
          const hasMinus = insight.change?.includes("-");
          
          const isGoodChange = (hasPlus && !insight.label.toLowerCase().includes("time")) || 
                              (hasMinus && insight.label.toLowerCase().includes("time"));

          return (
            <div key={i} className="bg-[#F8F8F8] p-5 rounded-[8px] border-[0.35px] border-[#0000001A] shadow-sm flex flex-col gap-2">
              <span className="text-[12px] text-[#4F4F4F] font-normal">{insight.label}</span>
              <div className="flex items-end justify-between">
                <span className="text-[24px] font-bold text-[#02022C] leading-none">{displayValue}</span>
                {insight.change && (
                  <span className={cn(
                    "text-[11px] font-bold px-2 py-0.5 rounded-full mb-1",
                    isGoodChange ? "text-green-600 bg-green-50" : (hasMinus || hasPlus ? "text-red-600 bg-red-50" : "text-[#02022C]")
                  )}>
                    {insight.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudioPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>();
  const [Videos, setVideos] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [campaignToView, setCampaignToView] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [initialUserPrompt, setInitialUserPrompt] = useState("");
  const [initialUserAssets, setInitialUserAssets] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [aiResponseContent, setAiResponseContent] = useState("");
  const [activePipelineIndex, setActivePipelineIndex] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [showVoices, setShowVoices] = useState<Array<any>>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      let allSessions: Campaign[] = [];
      try {
        const sessionRes = await apiFetch(`${API_BASE}/ai/director/sessions?t=${Date.now()}`, {
          headers: { "accept": "*/*" },
          cache: "no-store"
        });

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const rawData = sessionData.data?.sessions || sessionData.sessions || sessionData.data;
          const sessionsArray = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

          if (Array.isArray(sessionsArray)) {
            // STRICT FILTER: Only include sessions that have a valid session identifier (Studio-originated)
            const sessionsOnly = sessionsArray.filter((s: any) => s.session_id || s.sessionId);

            allSessions = sessionsOnly.map((s: any) => {
              const brief = s.brief_draft || {};
              const sId = s.session_id || s.sessionId || s.id;

              return {
                id: s.campaign_id || s.id,
                sessionId: sId,
                title: s.title || (brief.business_name ? `${brief.business_name} Active Simulation` : `Studio Session ${sId}`),
                status: s.status || s.campaign_status || "ready",
                message: s.message,
                videoUrl: s.video_url,
                voiceoverUrl: s.voiceover_url || s.audio_url,
                musicUrl: s.music_url || s.production?.music_url,
                script: s.script,
                audience: brief.audience,
                objective: brief.objective,
                format: brief.format,
                duration: brief.duration,
                colorScheme: brief.color_scheme || brief.colorScheme,
                platforms: brief.platforms || (brief.platform ? [brief.platform] : []),
                tones: brief.tones,
                visualStyles: brief.visual_style || brief.visualStyles,
                image: s.image_urls?.length ? s.image_urls : (s.nodes?.generate_image?.result?.scene_images?.length ? s.nodes.generate_image.result.scene_images : "/assets/hashtag-campaign.jpg"),
                createdAt: s.created_at,
                history: s.history,
                prompt: s.prompt,
                completed_nodes: s.completed_nodes || [],
                voice: s.voice || brief.voice,
                campaign_status: s.campaign_status,
                step_approvals: s.step_approvals
              };
            });
          }
        }
      } catch (err) {
        console.warn("Sessions fetch failed:", err);
      }

      try {
        const insightRes = await apiFetch(`${API_BASE}/ai/insights/director?t=${Date.now()}`);
        if (insightRes.ok) {
          const insightData = await insightRes.json();
          if (insightData.success && insightData.data?.metrics) {
            setInsights(insightData.data.metrics);
          }
        }
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      }

      const sortLatest = (list: Campaign[]) => {
        return list
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
      };

      const sortedVideos = sortLatest(allSessions);
      setVideos(sortedVideos);
      setCampaigns(sortedVideos); // Align both states to only show sessions

      const terminalStatuses = ["completed", "Ready", "delivered", "failed", "ready_for_human_review", "approved"];
      const activeCandidates = allSessions
        .filter(s => {
          const status = s.status?.toLowerCase() || "";
          return !terminalStatuses.some(ts => status.includes(ts.toLowerCase()));
        })
        .sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        })
        .slice(0, 5);
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') return;
      console.error("Critical error in fetchCampaigns:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setIsDeleteModalOpen(true);
  };

  const handleViewDetails = (campaign: Campaign) => {
    setIsModalOpen(false);
    setShowAIResponse(false);
    setCampaignToView(campaign);

    setIsPreviewOpen(true);
  };

  const handleViewDetailsforcampaigns = (campaign: Campaign) => {
    setIsModalOpen(false);
    setShowAIResponse(false);
    setCampaignToView(campaign);

    setIsSelectionModalOpen(true);
  };


  const handleSelectVoice = (voice: string) => {
    setSelectedVoice(voice);
  };

  const handlePromptSend = async (prompt: string, assets?: any[]) => {
    if (isSending) return;
    setIsSending(true);

    const sessionId = Date.now().toString();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Combine assets into the prompt text for AI visibility if provided
    let enrichedMessage = enrichMessageWithCampaign(prompt, selectedCampaign);
    if (assets && assets.length > 0) {
      const assetListStr = assets.map(a => {
        const metadataStr = a.rawMetadata ? ` (Original Prompt: ${a.rawMetadata.title || "N/A"})` : "";
        const sizeStr = typeof a.fileSize === 'number' ? formatFileSize(a.fileSize) : (a.fileSize || "Unknown");
        return `- **${a.name}** (${a.type})\n  URL: ${a.url}\n  Size: ${sizeStr}${metadataStr}`;
      }).join("\n\n");
      
      enrichedMessage = `${enrichedMessage}\n\n### ATTACHED MEDIA CONTEXT ###\nThe user has attached the following assets from their library:\n${assetListStr}\n---`;
    }

    try {
      const response = await apiFetch(`${API_BASE}/ai/director/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: enrichedMessage,
          assets: (assets || []).map((a: any) => ({
            id: a.id,
            dbId: a.dbId,
            name: a.name,
            url: a.url,
            type: a.type,
            fileSize: a.fileSize,
            origin: a.origin,
            campaignId: a.campaignId,
            userId: a.userId,
            createdAt: a.createdAt,
          })),
          professional_name: "",
          tag: "director"
        }),
      });

      if (!response.ok) throw new Error("Failed to communicate with AI Director");
      const data = await response.json();

      const responseData = Array.isArray(data?.data) ? data.data[0] : (data?.data || data);
      const aiResponse = responseData?.response || responseData?.message || responseData?.ai_message || "I've analyzed your requirements. Let's start building your campaign.";

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: prompt, // Store the raw prompt for the user UI
        timestamp: new Date().toISOString(),
        assets: assets || []
      };

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      const newSession = {
        id: sessionId,
        title: prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt,
        messages: [userMessage, aiMessage],
        urls: [],
        tag: "director",
        createdAt: new Date().toISOString()
      };

      const existingSessionsStr = localStorage.getItem("chat_sessions");
      let existingSessions = [];
      if (existingSessionsStr) {
        try {
          existingSessions = JSON.parse(existingSessionsStr);
        } catch (e) {
          console.error("Failed to parse existing sessions", e);
        }
      }

      localStorage.setItem("chat_sessions", JSON.stringify([newSession, ...existingSessions]));

      setInitialUserPrompt(enrichedMessage);
      setInitialUserAssets(assets || []);
      setAiResponseContent(aiResponse);
      setCurrentSessionId(sessionId);

      setIsSelectionModalOpen(false);
      setIsModalOpen(false);
      setShowAIResponse(true);

      const campaignStatus = responseData?.campaign_status;
      const action = responseData?.action;

      if (action === "generate_image") {
        // Force refresh to get the latest session with images
        fetchCampaigns();
      }

      if (campaignStatus === "queued" || campaignStatus === "in_production" || action === "generate_image") {
        const brief = responseData?.brief_draft || {};
        const title = brief.business_name ? `${brief.business_name} Campaign` : prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
        const finalStatus = (action === "generate_image" && responseData?.image_urls?.length) ? "completed" : campaignStatus;

        setVideos(prev => {
          const exists = prev.findIndex(v => v.sessionId === sessionId);
          if (exists !== -1) {
            const updated = [...prev];
            updated[exists] = {
              ...updated[exists],
              id: responseData?.campaign_id || updated[exists].id,
              status: finalStatus,
              title: title || updated[exists].title,
            };
            return updated;
          }
          return [{
            id: responseData?.campaign_id,
            sessionId: sessionId,
            title: title,
            status: finalStatus,
            image: responseData?.image_urls?.length ? responseData.image_urls[0] : "/assets/hashtag-campaign.jpg"
          }, ...prev];
        });
        setActivePipelineIndex(0);
      }

      setIsSending(false);
    } catch (err) {
      console.error("AI Director Error:", err);
      toast.error("Failed to connect to AI Director. Please ensure the backend is running.");
      setIsSending(false);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    setIsDeleting(true);
    try {
      if (campaignToDelete.id) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await apiFetch(`${API_BASE}/campaigns/${campaignToDelete.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete campaign block");
      }

      // Explicitly delete from the AI director if there's a session ID,
      // because sometimes the session ID (e.g., a timestamp) doesn't match the DB campaign ID cleanly.
      if (campaignToDelete.sessionId) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await apiFetch(`${API_BASE}/ai/director/session/${campaignToDelete.sessionId}`, {
          method: "DELETE",
        }).catch(err => console.warn("Failed to delete orphaned AI session:", err));
      }

      setCampaigns(prev => prev?.filter(c => (c.id && campaignToDelete.id && c.id !== campaignToDelete.id) || (c.title !== campaignToDelete.title)));
      setVideos(prev => prev.filter(v => (v.id && campaignToDelete.id && v.id !== campaignToDelete.id) || (v.title !== campaignToDelete.title)));

      if (selectedCampaign?.title === campaignToDelete.title) {
        setSelectedCampaign(null);
      }
      setIsDeleteModalOpen(false);
      setCampaignToView(null);
      setCampaignToDelete(null);
      setActivePipelineIndex(0);
      toast.success("Campaign deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete campaign. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const videosRef = useRef<Campaign[]>(Videos);
  useEffect(() => {
    videosRef.current = Videos;
  }, [Videos]);

  const sessionFailuresRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;
    const abortController = new AbortController();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const poll = async () => {
      if (!isActive) return;
      const currentVideos = videosRef.current;
      const activeStatuses = ["queued", "in_production", "pipeline_running", "In Production", "processing", "rendering"];
      const terminalStatuses = ["completed", "Ready", "delivered", "failed", "ready_for_human_review", "approved"];

      const polls = currentVideos.filter(v => {
        if (!v.sessionId) return false;

        const status = v.status?.toLowerCase() || "";
        const cStatus = v.campaign_status?.toLowerCase() || "";

        // 1. Is the top-level status terminal?
        const isTerminal = terminalStatuses.some(s => status.includes(s.toLowerCase()));

        // 2. Are any of the statuses actively queued or rendering?
        const hasActiveStatus = activeStatuses.some(s => status.includes(s.toLowerCase()) || cStatus.includes(s.toLowerCase()));

        // 3. Has this session failed too many times?
        const failureCount = sessionFailuresRef.current[v.sessionId] || 0;
        const hasNotFailed = failureCount < 5;

        // DECISION LOGIC:
        // Never poll if it's terminal.
        // Otherwise, poll if it has an active status OR an unknown non-empty status.
        let shouldPoll = false;
        if (!isTerminal) {
          if (hasActiveStatus || status !== "") {
            shouldPoll = true;
          }
        }

        shouldPoll = shouldPoll && hasNotFailed;

        if (shouldPoll) {
          console.log(`[Polling] Active session found: ${v.sessionId} (status: '${status}', cStatus: '${cStatus}')`);
        }

        return shouldPoll;
      });

      if (polls.length > 0) {
        let isFirstPoll = true;
        for (const v of polls) {
          if (!isActive) return;
          if (!v.sessionId) continue;

          if (!isFirstPoll) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          isFirstPoll = false;

          try {
            const res = await apiFetch(`${API_BASE}/ai/director/session/${v.sessionId}/update?t=${Date.now()}`, {
              headers: { "accept": "*/*" },
              signal: abortController.signal
            });

            if (res.ok) {
              const resData = await res.json();
              const updateData = resData.data || resData;
              sessionFailuresRef.current[v.sessionId] = 0;

              // HITL: If status is awaiting approval, get the latest DB state for assets
              const isAwaitingApproval = updateData?.status?.toLowerCase().startsWith("awaiting_approval_") || updateData?.status?.toLowerCase().startsWith("awaiting_");
              let hitlData = null;
              if (isAwaitingApproval) {
                try {
                  const dbUpdateRes = await apiFetch(`${API_BASE}/ai/director/session/${v.sessionId}/db-update?t=${Date.now()}`);
                  if (dbUpdateRes.ok) {
                    const dbData = await dbUpdateRes.json();
                    hitlData = dbData.data || dbData;
                  }
                } catch (e) {
                  console.warn("db-update fetch failed:", e);
                }
              }

              if (updateData) {
                setVideos(prevVideos => {
                  const updatedVideos = [...prevVideos];
                  const index = updatedVideos.findIndex(vid => vid.sessionId === v.sessionId);
                  if (index !== -1) {
                    if (
                      updatedVideos[index].status !== updateData.status ||
                      updatedVideos[index].campaign_status !== updateData.campaign_status ||
                      updatedVideos[index].message !== updateData.message ||
                      updatedVideos[index].videoUrl !== updateData.video_url ||
                      JSON.stringify(updatedVideos[index].image) !== JSON.stringify(updateData.image_urls)
                    ) {
                      const isInvalidStatus = !updateData.status || updateData.status.toLowerCase() === 'failed';
                      const prevStatus = updatedVideos[index].status?.toLowerCase() || "";
                      const prevCampaignStatus = updatedVideos[index].campaign_status?.toLowerCase() || "";
                      const prevInProduction = prevStatus === "in_production" || prevStatus === "queued" || prevCampaignStatus === "in_production" || prevCampaignStatus === "queued";

                      const nextStatus = (isInvalidStatus && prevInProduction) ? updatedVideos[index].status : (updateData.status || updatedVideos[index].status);

                      updatedVideos[index] = {
                        ...updatedVideos[index],
                        status: nextStatus,
                        campaign_status: updateData.campaign_status,
                        message: updateData.message || updatedVideos[index].message,
                        videoUrl: updateData.video_url || updatedVideos[index].videoUrl,
                        voiceoverUrl: updateData.voiceover_url || updateData.audio_url || updatedVideos[index].voiceoverUrl,
                        musicUrl: updateData.music_url || updatedVideos[index].musicUrl,
                        script: updateData.script || updatedVideos[index].script,
                        history: updateData.history || updatedVideos[index].history,
                        prompt: updateData.prompt || updatedVideos[index].prompt,
                        completed_nodes: updateData.completed_nodes || [],
                        // Sync image_urls from DB for card slideshow
                        image: updateData.image_urls?.length ? updateData.image_urls
                          : (updateData.hitl?.image_urls?.length ? updateData.hitl.image_urls
                          : (hitlData?.image_urls?.length ? hitlData.image_urls : updatedVideos[index].image)),
                        hitl: updateData.hitl || hitlData || updatedVideos[index].hitl,
                      };
                      return updatedVideos;
                    }
                  }
                  return prevVideos;
                });
              }
            } else if (res.status === 404) {
              sessionFailuresRef.current[v.sessionId] = (sessionFailuresRef.current[v.sessionId] || 0) + 1;
            }
          } catch (e: any) {
            if (e.name === 'AbortError') {
              console.log('Studio poll fetch aborted');
            } else {
              const isNetworkError = e instanceof TypeError && e.message.includes("fetch");
              if (!isNetworkError) console.error("Polling error for", v.sessionId, e);
              sessionFailuresRef.current[v.sessionId] = (sessionFailuresRef.current[v.sessionId] || 0) + 1;
            }
          }
        }
      }
      if (isActive) {
        timeoutId = setTimeout(poll, 3000);
      }
    };
    // Initial delay before starting the loop to avoid immediate redundant calls
    timeoutId = setTimeout(poll, 3000);
    return () => {
      isActive = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  // Sync campaignToView with the latest polling data from Videos
  useEffect(() => {
    if (isPreviewOpen && campaignToView?.sessionId) {
      const latest = Videos.find(v => v.sessionId === campaignToView.sessionId);
      if (latest && (
        latest.status !== campaignToView.status ||
        latest.videoUrl !== campaignToView.videoUrl ||
        latest.image !== campaignToView.image ||
        latest.script !== campaignToView.script
      )) {
        setCampaignToView(latest);
      }
    }
  }, [Videos, isPreviewOpen, campaignToView?.sessionId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsModalOpen(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("create");
      const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
      router.replace(newUrl);
    }
  }, [searchParams, router]);



  if (isLoading && (!Videos || Videos.length === 0)) {
    return <StudioLoadingState />;
  }

  const activeVideos = Videos.filter(v => v.status);
  const currentPipelineCampaign = activeVideos[activePipelineIndex] || activeVideos[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-[12px]  mx-auto p-4 lg:p-6">
        <StudioHero
          onCreateClick={() => {
            setIsSelectionModalOpen(false);
            setShowAIResponse(false);
            setIsModalOpen(true);
          }}
          campaigns={campaigns}
          selectedCampaign={selectedCampaign}
          onCampaignSelect={setSelectedCampaign}
          onCampaignDelete={handleDeleteCampaign}
          onViewDetails={handleViewDetails}
          onViewDetailsforcampaigns={handleViewDetailsforcampaigns}
          onSend={handlePromptSend}
          isSending={isSending}
        />

        <ActiveCampaignsGrid
          campaigns={activeVideos}
          onDelete={handleDeleteCampaign}
          onViewMore={() => router.push("/projects")}
          onViewDetails={handleViewDetails}
          activeIndex={activePipelineIndex}
          onSelect={setActivePipelineIndex}
          onRefresh={fetchCampaigns}
        />

        <div className="flex flex-col gap-4 bg-[#FFFFFF] border-[0.35px] border-[#0000001A] rounded-[12px] p-[16px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#121212]">
              AI Production Pipeline
            </h2>
            {currentPipelineCampaign && (
              <span className="text-[12px] font-bold text-[#121212] uppercase tracking-wider">
                {currentPipelineCampaign.title}
              </span>
            )}
          </div>
          <ProductionPipeline
            status={currentPipelineCampaign?.status || "Draft"}
            message={currentPipelineCampaign?.message || ""}
            videoUrl={currentPipelineCampaign?.videoUrl}
            completedNodes={currentPipelineCampaign?.completed_nodes}
            campaignStatus={currentPipelineCampaign?.campaign_status}
            stepApprovals={currentPipelineCampaign?.step_approvals}
            mediaType={currentPipelineCampaign?.format}
          />
        </div>

        <CampaignInsights insights={insights} />
      </div>

      <button className="fixed bottom-6 right-8 w-[60px] h-[60px] bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 shadow-brand-primary/20">
        <Icons.MessageCircle className="w-6 h-6" />
      </button>

      <CreateCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteCampaign}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaignToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      <CampaignSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => {
          setIsSelectionModalOpen(false);
          setCampaignToView(null);
        }}
        campaigns={campaigns || []}
        onSelect={(c: Campaign) => setSelectedCampaign(c)}
        onCreateNew={() => {
          setIsSelectionModalOpen(false);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteCampaign}
        initialSelectedCampaign={campaignToView}
      />

      <CampaignPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setCampaignToView(null);
        }}
        campaignData={campaignToView ? {
          title: campaignToView.title,
          session_id: campaignToView.sessionId,
          status: campaignToView.status,
          message: campaignToView.message,
          video_url: campaignToView.videoUrl,
          voiceover_url: campaignToView.voiceoverUrl,
          music_url: campaignToView.musicUrl,
          script: campaignToView.script,
          history: campaignToView.history,
          prompt: campaignToView.prompt,
          voice_id: campaignToView.voice,
          campaign_id: campaignToView.id,
          campaign_status: campaignToView.campaign_status,
          hitl: campaignToView.hitl,
          image_urls: Array.isArray(campaignToView.image)
            ? campaignToView.image
            : campaignToView.image
              ? [campaignToView.image]
              : [],
        } : null}
        showHistory={false}
        onSelectVoice={handleSelectVoice}
        onSwitchCampaign={() => {
          setIsPreviewOpen(false);
          setIsSelectionModalOpen(true);
        }}
        onRefresh={fetchCampaigns}
      />

      <AIResponseModal
        isOpen={showAIResponse}
        onClose={() => {
          setShowAIResponse(false);
          setAiResponseContent("");
          setInitialUserPrompt("");
          setCurrentSessionId("");
          fetchCampaigns();
        }}
        initialUserMessage={initialUserPrompt}
        initialAIResponse={aiResponseContent}
        sessionId={currentSessionId}
        initialHistory={campaignToView?.history || []}
        selectedCampaign={selectedCampaign}
        initialUserAssets={initialUserAssets}
        onCampaignStart={(campaign: Campaign) => {
          setVideos(prev => {
            const exists = prev.findIndex(v => v.sessionId === campaign.sessionId);
            if (exists !== -1) {
              const updated = [...prev];
              updated[exists] = { ...updated[exists], ...campaign };
              return updated;
            }
            return [campaign, ...prev];
          });
        }}
      />
    </DashboardLayout>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="p-6">Loading studio...</div>
        </DashboardLayout>
      }
    >
      <StudioPageContent />
    </Suspense>
  );
}
