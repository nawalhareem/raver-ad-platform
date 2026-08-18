import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { VoiceSelector, VOICE_OPTIONS } from "@/components/agents/audio-lead/VoiceSelector";
import { normalizeAssetUrl } from "@/lib/utils";
import { toast } from "react-toastify";
import ImageViewerModal from "@/components/agents/ImageViewerModal";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface CampaignPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignData: {
    title?: string;
    session_id?: string;
    message?: string;
    status?: string;
    campaign_id?: string;
    video_url?: string | null;
    voiceover_url?: string | null;
    music_url?: string | null;
    script?: string | null;
    history?: { role: string; content: string }[] | null;
    prompt?: string | null;
    voice_id?: string | null;          // Added: voice_id from campaign
    campaign_status?: string | null;
    hitl?: any;
    nodes?: any;
    image_urls?: string[] | null;
  } | null;
  showHistory?: boolean;
  onRefresh?: () => void;
  onSelectVoice?: (voice: string) => void;
  onSwitchCampaign?: () => void;
}


const cleanContent = (content: string) => {
  let cleaned = content;
  if (cleaned.includes("[USER MESSAGE]:")) {
    cleaned = cleaned.split("[USER MESSAGE]:").pop() || cleaned;
  }
  if (cleaned.trim().startsWith("{") && cleaned.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.response) cleaned = parsed.response;
      else if (parsed.message) cleaned = parsed.message;
    } catch (e) {
      /* keep source if parse fails */
    }
  }
  return cleaned.trim();
};

export default function CampaignPreviewModal({
  isOpen,
  onClose,
  campaignData,
  showHistory = false,
  onRefresh,
  onSelectVoice,
  onSwitchCampaign,
}: CampaignPreviewModalProps) {
  const { user } = useUser();
  const [localHistory, setLocalHistory] = useState<{ role: string; content: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | undefined>(campaignData?.status);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  // Editing states
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState(campaignData?.script || "");
  const [selectedVoice, setSelectedVoice] = useState<string>(campaignData?.voice_id?.toLowerCase() || "adam");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  const [stepNotes, setStepNotes] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [localHitl, setLocalHitl] = useState<any>(campaignData?.hitl);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(campaignData?.video_url || null);
  const [localMusicUrl, setLocalMusicUrl] = useState<string | null>(campaignData?.music_url || null);
  const [localVoiceoverUrl, setLocalVoiceoverUrl] = useState<string | null>(campaignData?.voiceover_url || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isSpeechLoading } = useTextToSpeech();
  const [autoSpeak, setAutoSpeak] = useState(false);
  const lastSpokenMessageId = useRef<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Centralized auto-speak logic
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      lastSpokenMessageId.current = null;
      setCurrentlySpeakingId(null);
      return;
    }

    const lastAIMessage = [...localHistory].reverse().find(m => m.role === "assistant" || m.role === "ai");

    if (!lastAIMessage) return;

    const currentId = `${lastAIMessage.role}-${cleanContent(lastAIMessage.content).length}-${cleanContent(lastAIMessage.content).substring(0, 50)}`;
    
    // Initialize lastSpokenMessageId when modal opens to avoid auto-speaking history
    if (lastSpokenMessageId.current === null) {
      lastSpokenMessageId.current = currentId;
      return;
    }

    const isNewMessage = lastSpokenMessageId.current !== currentId;

    if (autoSpeak && isNewMessage) {
      const cleaned = cleanContent(lastAIMessage.content);
      console.log(`[CampaignPreviewModal] Auto-speaking:`, cleaned);
      speak(cleaned);
      lastSpokenMessageId.current = currentId;
      setCurrentlySpeakingId(currentId);
    }
  }, [autoSpeak, isOpen, localHistory, speak, stopSpeaking]);

  // Sync isSpeaking state back to currentlySpeakingId
  useEffect(() => {
    if (!isSpeaking) {
      setCurrentlySpeakingId(null);
    }
  }, [isSpeaking]);

  // Handle manual play/pause
  const handleToggleSpeech = (content: string, id: string) => {
    const cleanedContent = cleanContent(content);
    console.log(`[CampaignPreviewModal] Manually toggling speech:`, cleanedContent);
    if (isSpeaking && currentlySpeakingId === id) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      speak(cleanedContent);
      setCurrentlySpeakingId(id);
    }
  };

  // Get the name of the selected voice for display
  const selectedVoiceName =
    VOICE_OPTIONS.find((v) => v.id.toLowerCase() === selectedVoice?.toLowerCase())?.name || selectedVoice || "Neural Selection";

  // Initialize state when the modal opens or when the session ID changes
  useEffect(() => {
    if (isOpen && campaignData) {
      // Clear interactive/cached states so we get a fresh view
      setSelectedAssetId(null);
      setStepNotes("");
      setMusicPrompt("");
      setIsEditingScript(false);

      if (campaignData.history) setLocalHistory(campaignData.history);
      setLocalStatus(campaignData.status);
      setEditedScript(campaignData.script || "");

      if (campaignData.voice_id) {
        setSelectedVoice(campaignData.voice_id.toLowerCase());
      } else {
        setSelectedVoice("adam"); // Reset to default if none
      }

      setLocalHitl(campaignData.hitl || null);
      setLocalVideoUrl(campaignData.video_url || null);
      setLocalMusicUrl(campaignData.music_url || null);
      setLocalVoiceoverUrl(campaignData.voiceover_url || null);

      // Proactively fetch latest DB state for hitl/approval info
      if (campaignData.session_id) {
        fetchDbUpdate();
      }
    }
  }, [isOpen, campaignData?.session_id]); // Only run when modal opens or session changes

  // Keep local fields in sync with campaignData when it updates from polling
  useEffect(() => {
    if (isOpen && campaignData) {
      if (campaignData.status) setLocalStatus(campaignData.status);
      if (campaignData.video_url && !localVideoUrl) setLocalVideoUrl(campaignData.video_url);
      if (campaignData.music_url && !localMusicUrl) setLocalMusicUrl(campaignData.music_url);
      if (campaignData.voiceover_url && !localVoiceoverUrl) setLocalVoiceoverUrl(campaignData.voiceover_url);
      if (campaignData.hitl) setLocalHitl(campaignData.hitl);
      if (campaignData.history && campaignData.history.length > localHistory.length) {
        setLocalHistory(campaignData.history);
      }
      
      // Only sync script from backend if the user isn't currently editing it
      if (!isEditingScript && campaignData.script) {
        setEditedScript(campaignData.script);
      }
    }
  }, [campaignData, isOpen, isEditingScript]); // Run whenever polling updates campaignData

  const fetchDbUpdate = async () => {
    if (!campaignData?.session_id) return;
    setIsRefreshing(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await apiFetch(`${API_BASE}/ai/director/session/${campaignData.session_id}/db-update?t=${Date.now()}`);
      if (res.ok) {
        const resData = await res.json();
        const data = resData.data;
        if (data) {
          setLocalHitl(data);
          // Sync newer state if available in DB
          if (data.status) setLocalStatus(data.status);
          if (data.history) setLocalHistory(data.history);
          if (data.script) setEditedScript(data.script);
          if (data.video_url) setLocalVideoUrl(data.video_url);
          if (data.music_url) setLocalMusicUrl(data.music_url);
          if (data.voiceover_url) setLocalVoiceoverUrl(data.voiceover_url);
        }
      }
    } catch (e) {
      console.warn("Manual db-update fetch failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-select asset if only one is available
  useEffect(() => {
    const candidates = localHitl?.candidates || 
                        localHitl?.image_urls || 
                        campaignData?.nodes?.generate_image?.result?.scene_images || 
                        [];
    if (candidates.length === 1 && !selectedAssetId) {
      const firstId = candidates[0]?.id || "0";
      setSelectedAssetId(firstId);
    }
  }, [localHitl, selectedAssetId]);

  const handleApplyChanges = async () => {
    if (!campaignData?.session_id && !campaignData?.campaign_id) return;

    setIsApplyingChanges(true);
    const toastId = toast.info("🚀 Sending regeneration request to AI Director...", {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    });

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Build the change request message
      let changeMessage = "I need you to regenerate this campaign with the following changes:\n\n";

      if (editedScript && editedScript !== campaignData.script) {
        changeMessage += `Change the script to: "${editedScript}"\n\n`;
      }

      if (selectedVoice) {
        changeMessage += `Use voice: ${selectedVoice}\n\n`;
      }

      if (musicPrompt) {
        changeMessage += `Change the background music to: ${musicPrompt}\n\n`;
      }

      changeMessage += "Please apply these changes and regenerate the video now.";

      toast.update(toastId, {
        render: "⏳ AI Director is processing your changes...",
        type: "info",
      });

      // Send message to Director AI to handle regeneration
      const response = await apiFetch(`${API_BASE}/ai/director/regenerate-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({
          session_id: campaignData.campaign_id,
          campaign_id: campaignData.campaign_id,
          message: changeMessage + `voice of the script ${selectedVoice || "adam"} and background music style ${musicPrompt || "original"}`,
          tag: "director"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to apply changes");
      }

      toast.update(toastId, {
        render: "✅ Regeneration started! Pipeline is now running.",
        type: "success",
        autoClose: 3000,
      });

      setLocalStatus("in_production");
      setIsEditingScript(false);

      // Give the user time to see the success toast, then close and reload
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onRefresh) onRefresh();
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error("Apply changes error:", error);
      toast.update(toastId, {
        render: `❌ ${error.message || "Failed to apply changes. Please try again."}`,
        type: "error",
        autoClose: 5000,
      });
    } finally {
      setIsApplyingChanges(false);
    }
  };

  const handleCopyUrl = (url: string, label: string) => {
    if (!url) return;
    const normalizedUrl = normalizeAssetUrl(url);
    navigator.clipboard.writeText(normalizedUrl);
    toast.success(`${label} link copied to clipboard`);
  };

  const handleApprove = async () => {
    if (!campaignData?.session_id) {
      toast.error("No session ID found to approve.");
      return;
    }

    setIsApproving(true);
    const toastId = toast.loading("Finalizing campaign authorization...");

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = getToken();

      const response = await fetch(`${API_BASE}/ai/director/session/${campaignData.session_id}/approve`, {
        method: 'PATCH',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to approve campaign: ${response.statusText}`);
      }

      toast.update(toastId, {
        render: "✓ Campaign successfully approved and finalized!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setLocalStatus("approved");

      // Give the user time to see the success toast, then close and reload
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onRefresh) onRefresh();
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.update(toastId, {
        render: `Error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleStepAction = async (action: "approve" | "improve" | "reject") => {
    const sId = campaignData?.session_id || campaignData?.campaign_id;
    if (!sId) {
      toast.error("No session identifier found.");
      return;
    }

    const currentStatus = localStatus?.toLowerCase() || "";
    const stepName = currentStatus.startsWith("awaiting_approval_")
      ? currentStatus.replace("awaiting_approval_", "")
      : currentStatus.startsWith("awaiting_")
      ? currentStatus.replace("awaiting_", "")
      : "render"; // Fallback to render if status is ambiguous

    setIsProcessingStep(true);
    const toastId = toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing ${stepName.replace("_", " ")}...`);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = getToken();

      // Ensure we have correct step name for the API if it's rendered slightly differently in status
      // Mapping common statuses back to API expected step names if needed

      let finalNotes = stepNotes || (action === "approve" ? "Looks good" : "Requires changes");
      
      // Only include the current voice selection in the notes for the AI Director if we are reviewing the voice
      if (stepName.includes("voice")) {
        const finalVoice = selectedVoice || "adam";
        const finalVoiceName = VOICE_OPTIONS.find(v => v.id.toLowerCase() === finalVoice.toLowerCase())?.name || finalVoice;
        finalNotes = `${finalNotes} (Selected Voice: ${finalVoiceName}${finalVoice !== finalVoiceName ? ` - ${finalVoice}` : ""})`;
      }

      const bodyData: any = {
        step_name: stepName,
        action: action,
        notes: finalNotes
      };

      if (selectedAssetId) {
        // Parse the string to an integer first to avoid string concatenation (e.g., "0" + 1 = "01")
        bodyData.selected_asset_id = parseInt(selectedAssetId, 10) + 1;
      }

      const response = await fetch(`${API_BASE}/ai/director/session/${sId}/approve-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} step: ${response.statusText}`);
      }

      toast.update(toastId, {
        render: `Successfully ${action}d ${stepName.replace("_", " ")}!`,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setStepNotes("");
      setSelectedAssetId(null);

      if (onRefresh) onRefresh();
      onClose();
      // Status will be updated by polling in parent
    } catch (error: any) {
      console.error(`Step ${action} error:`, error);
      toast.update(toastId, {
        render: `Error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsProcessingStep(false);
    }
  };

  // Auto-scroll chat internally without affecting main container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [localHistory, isGenerating]);

  // Ensure modal starts at top when opened
  useEffect(() => {
    if (isOpen) {
      mainContentRef.current?.scrollTo(0, 0);
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating || !campaignData?.session_id) return;

    const userMsg = { role: "user", content: inputText.trim() };
    setLocalHistory((prev) => [...prev, userMsg]);
    setInputText("");
    setIsGenerating(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const sId = campaignData.session_id || campaignData.campaign_id;
      const response = await apiFetch(`${API_BASE}/ai/director/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({
          session_id: sId,
          message: userMsg.content,
          assets: [],
          tag: "director",
        }),
      });

      if (!response.ok) throw new Error("AI Director Communication Failed");
      const data = await response.json();

      const aiResponseContent = data?.data?.message || data?.message || data?.data?.response || data?.response || "I've updated the campaign details.";
      const aiMsg = { role: "assistant", content: aiResponseContent };

      setLocalHistory((prev) => [...prev, aiMsg]);

      // Immediate speak for new responses
      if (autoSpeak) {
        const cleaned = cleanContent(aiResponseContent);
        const msgId = `${aiMsg.role}-${cleaned.length}-${cleaned.substring(0, 50)}`;
        speak(cleaned);
        lastSpokenMessageId.current = msgId;
        setCurrentlySpeakingId(msgId);
      }

      // Check for Launch trigger
      if (data?.data?.campaign_status === "queued" || data?.data?.campaign_status === "in_production") {
        setLocalStatus(data.data.campaign_status);
      }

      // Proactively refresh latest DB state for hitl/approval info after chat
      try {
        const sId = campaignData.session_id || campaignData.campaign_id;
        await apiFetch(`${API_BASE}/ai/director/session/${sId}/update?t=${Date.now()}`);
      } catch (e) {
        console.warn("Status update fetch failed after chat:", e);
      }
      fetchDbUpdate();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Preview Chat Error:", err);
      setLocalHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error updating the campaign. Please try again.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !campaignData || !campaignData.session_id) return null;
  const isLaunched = ["in_production", "queued", "In Production", "Ready", "completed", "delivered", "ready", "approved"].includes(
    localStatus || ""
  );
  const isApproved = (localStatus?.toLowerCase() === "approved" || localStatus?.toLowerCase() === "delivered");
  const isRejected = localStatus?.toLowerCase() === "rejected";
  const isFailed = localStatus?.toLowerCase() === "failed";
  const isDraft = localStatus?.toLowerCase() === "ready_for_human_review";
  const isAwaitingApproval = localStatus?.toLowerCase().startsWith("awaiting_approval") || localStatus?.toLowerCase().startsWith("awaiting_");
  const hasLaunched = localHistory.some(m => m.content.includes("LAUNCH_CAMPAIGN")) || 
    ["in_production", "queued", "In Production", "completed", "delivered", "approved"].includes(localStatus || "");
  const canChat = !hasLaunched && !isRejected && !isFailed && !isApproved; // Disallow chat after launch, rejection, failure, or approval
  const lastAIMsg = [...localHistory].reverse().find(m => m.role === "assistant" || m.role === "ai");
  const isTerminalMessage = lastAIMsg?.content?.includes("Your image is queued — generation has started!") ||
    lastAIMsg?.content?.includes("Launching your campaign now") ||
    lastAIMsg?.content?.includes("Campaign started! I'll update you");

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-150 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between bg-white z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#02022C] rounded-xl flex items-center justify-center shadow-lg shadow-[#02022C]/10">
              <Icons.Eye className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[17px] font-bold text-[#121212]">{campaignData.title || "Campaign Preview"}</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-widest">
                    SID: {campaignData.session_id}
                  </span>
                  <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-widest">
                    CID: {campaignData.campaign_id}
                  </span>
                </div>
                {localStatus && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        (isRejected || isFailed) ? "bg-red-500 animate-pulse" : (isAwaitingApproval ? "bg-amber-500 animate-pulse" : (!isLaunched ? "bg-amber-500 animate-pulse" : (isApproved ? "bg-emerald-500" : "bg-green-500")))
                      )}
                    />
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      isApproved ? "text-emerald-600" : ((isRejected || isFailed) ? "text-red-600" : (isAwaitingApproval ? "text-amber-600" : "text-[#2E3A59]"))
                    )}>
                      {isApproved ? "Approved" : (isRejected ? "Rejected" : (isFailed ? "Failed" : (isAwaitingApproval ? "Action Required" : (!isLaunched ? (isDraft ? "In Review" : "Consultation") : (localStatus === "ready" || localStatus === "Ready") ? "Ready" : (localStatus === "completed" || localStatus === "Completed") ? "Completed" : "Processing"))))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (autoSpeak) stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }} 
              className={cn(
                "p-2 rounded-full transition-colors group",
                autoSpeak ? "bg-blue-50 text-blue-600" : "hover:bg-[#F1F5F9] text-[#94A3B8]"
              )}
              title={autoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
            >
              {autoSpeak ? <Icons.Volume className="w-5 h-5" /> : <Icons.Mute className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors group cursor-pointer"
            >
              <Icons.Plus className="w-5 h-5 rotate-45 text-[#94A3B8] group-hover:text-[#121212]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          ref={mainContentRef} 
          className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8 bg-slate-50/50 will-change-transform overscroll-contain"
        >
          {/* Rejection/Failure Banner */}
          {(isRejected || isFailed) && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-[24px] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  {isFailed ? <Icons.AlertTriangle className="w-4 h-4 text-red-600" /> : <Icons.Plus className="w-4 h-4 text-red-600 rotate-45" />}
                </div>
                <p className="text-[12px] font-black text-red-600 uppercase tracking-widest">
                  {isFailed ? "Production Failed" : "Changes Required"}
                </p>
              </div>
              <p className="text-[14px] text-red-800 font-medium leading-relaxed">
                {localHitl?.error || (isFailed ? "Something went wrong during the production process." : "This campaign step requires revisions before production can continue.")}
              </p>
              <p className="text-[11px] text-red-600/60 font-bold uppercase tracking-wider">
                {isFailed ? "Please check the console or logs for more details, or try restarting the process." : "Please review the feedback above. This production attempt has been finalized as rejected."}
              </p>
            </div>
          )}

          {/* User Vision / Prompt section */}
          {(campaignData.prompt || campaignData.message) && (
            <div className="space-y-4">
              <h3 className="text-[12px] font-black text-[#02022C] uppercase tracking-[0.2em] opacity-40">
                Initial Campaign Concept
              </h3>
              <div className="bg-[#F8FAFC] text-[#4F4F4F] italic border border-[#F1F5F9] rounded-[32px] p-8 shadow-sm relative group">
                <MarkdownRenderer content={`"${campaignData.message || campaignData.prompt}"`} isUser={false} />
                <button 
                  onClick={() => handleToggleSpeech(campaignData.message || campaignData.prompt || "", `initial-${(campaignData.message || campaignData.prompt || "").length}-${(campaignData.message || campaignData.prompt || "").substring(0, 50)}`)}
                  className={cn(
                    "absolute right-6 top-6 p-2 transition-all duration-200",
                    isSpeaking && currentlySpeakingId === `initial-${(campaignData.message || campaignData.prompt || "").length}-${(campaignData.message || campaignData.prompt || "").substring(0, 50)}` 
                      ? "text-blue-600 scale-110" 
                      : "text-slate-400 hover:text-[#02022C] hover:scale-110"
                  )}
                  title={isSpeaking && currentlySpeakingId === `initial-${(campaignData.message || campaignData.prompt || "").length}-${(campaignData.message || campaignData.prompt || "").substring(0, 50)}` ? "Stop" : "Play"}
                >
                  {isSpeaking && currentlySpeakingId === `initial-${(campaignData.message || campaignData.prompt || "").length}-${(campaignData.message || campaignData.prompt || "").substring(0, 50)}` ? (
                    <Icons.Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Icons.Play className="w-5 h-5 fill-current" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Visual & Video section */}
          {(localVideoUrl || (localHitl?.image_urls?.length ?? 0) > 0 || (isAwaitingApproval && (localStatus?.includes("render") || localStatus?.includes("image")))) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-[12px] font-black text-[#02022C] uppercase tracking-[0.2em]">
                    {localVideoUrl ? "Visual & Video" : "Generated Assets"}
                  </h3>
                  {isAwaitingApproval && (localStatus?.includes("render") || localStatus?.includes("image")) && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-pulse">
                      <Icons.Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Reviewing</span>
                    </div>
                  )}
                </div>
                {localVideoUrl && (
                  <button
                    onClick={() => handleCopyUrl(localVideoUrl!, "Video")}
                    className="text-[11px] font-bold text-[#64748B] hover:text-[#02022C] transition-colors flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100"
                    title="Copy Video URL"
                  >
                    <Icons.Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </button>
                )}
              </div>

              {localVideoUrl && (
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 border border-[#F1F5F9] shadow-inner group">
                  <div className="relative w-full h-full">
                    {videoError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 text-white gap-3 p-8 text-center italic">
                        <Icons.AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
                        <div className="flex flex-col gap-1 items-center">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] not-italic">Production Stream Interrupted</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest max-w-xs">The generation pipeline produced a result, but the visual stream is currently inaccessible.</p>
                        </div>
                        <button
                          onClick={() => { setVideoError(false); }}
                          className="mt-2 px-6 py-2 bg-white text-[#02022C] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                          Attempt Reconnection
                        </button>
                      </div>
                    ) : (
                      <video
                        src={normalizeAssetUrl(localVideoUrl!)}
                        controls
                        muted={isMuted}
                        className="w-full h-full object-contain"
                        onError={() => setVideoError(true)}
                      />
                    )}

                    {!videoError && (
                      <>
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="absolute bottom-6 right-6 z-30 w-12 h-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all shadow-2xl"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <Icons.Mute className="w-5 h-5" /> : <Icons.Volume className="w-5 h-5" />}
                        </button>
                        {isMuted && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 animate-pulse text-white text-[10px] font-black uppercase tracking-widest">
                              Sound Muted - Click to Listen
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Scene Images Gallery - Added as requested */}
              {((localHitl?.image_urls?.length ?? 0) > 0 || (campaignData?.image_urls?.length ?? 0) > 0) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Icons.Image className="w-3.5 h-3.5 text-slate-400" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Gallery</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from(new Set([
                      ...(localHitl?.image_urls || []),
                      ...(campaignData?.image_urls || [])
                    ])).map((url: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="relative aspect-16/10 rounded-2xl overflow-hidden border border-[#F1F5F9] bg-slate-100 group/img cursor-zoom-in shadow-sm"
                        onClick={() => {
                          setSelectedImage(normalizeAssetUrl(url));
                          setIsPreviewOpen(true);
                        }}
                      >
                        <img 
                          src={normalizeAssetUrl(url)} 
                          alt={`Scene ${idx + 1}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/90 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icons.Search className="w-3 h-3 text-[#02022C]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audio Tracks */}
          {(localVoiceoverUrl || localMusicUrl || (isAwaitingApproval && (localStatus?.includes("voice") || localStatus?.includes("music")))) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(localVoiceoverUrl || (isAwaitingApproval && localStatus?.includes("voice"))) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[12px] font-black text-[#02022C] uppercase tracking-[0.2em]">Voiceover</h3>
                    {isAwaitingApproval && localStatus?.includes("voice") && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-pulse">
                        <Icons.Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Reviewing</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white border border-[#F1F5F9] rounded-2xl shadow-sm flex flex-col gap-3">
                    {localVoiceoverUrl ? (
                      <>
                        <div className="flex items-center gap-2">
                          <audio src={normalizeAssetUrl(localVoiceoverUrl!)} controls className="flex-1 h-8" />
                          <button
                            onClick={() => handleCopyUrl(localVoiceoverUrl!, "Voiceover")}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-[#02022C] border border-slate-100 flex items-center justify-center transition-all"
                            title="Copy Voiceover URL"
                          >
                            <Icons.Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Icons.Mic className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">
                            Profile: {selectedVoice ? selectedVoiceName : "Neural Casting"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-[#94A3B8] font-medium italic">Synchronizing neural voice track...</div>
                    )}
                  </div>
                </div>
              )}

              {(localMusicUrl || (isAwaitingApproval && localStatus?.includes("music"))) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[12px] font-black text-[#02022C] uppercase tracking-[0.2em]">Background Music</h3>
                    {isAwaitingApproval && localStatus?.includes("music") && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-pulse">
                        <Icons.Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Reviewing</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white border border-[#F1F5F9] rounded-2xl shadow-sm flex flex-col gap-3">
                    {localMusicUrl ? (
                      <div className="flex items-center gap-2">
                        <audio src={normalizeAssetUrl(localMusicUrl!)} controls className="flex-1 h-8" />
                        <button
                          onClick={() => handleCopyUrl(localMusicUrl!, "Music")}
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-[#02022C] border border-slate-100 flex items-center justify-center transition-all"
                          title="Copy Music URL"
                        >
                          <Icons.Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#94A3B8] font-medium">No music track available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Script Content - Editable */}
          {(editedScript || campaignData.script || (isAwaitingApproval && localStatus?.includes("text"))) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-[12px] font-black text-[#02022C] uppercase tracking-[0.2em]">Campaign Script</h3>
                  {isAwaitingApproval && localStatus?.includes("text") && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-pulse">
                      <Icons.Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Reviewing</span>
                    </div>
                  )}
                </div>
                {!isApproved && !isAwaitingApproval && <button
                  onClick={() => setIsEditingScript(!isEditingScript)}
                  className="text-[11px] font-bold text-[#02022C] hover:text-[#4F569B] transition-colors flex items-center gap-1"
                >
                  <Icons.PenLine className="w-3.5 h-3.5" />
                  {isEditingScript ? "Cancel" : "Edit Script"}
                </button>}
              </div>
              <div className="p-6 bg-[#02022C]/2 border border-[#F1F5F9] rounded-[24px] relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icons.MagicWand className="w-12 h-12 text-[#02022C]" />
                </div>
                {isEditingScript ? (
                  <textarea
                    value={editedScript}
                    onChange={(e) => setEditedScript(e.target.value)}
                    className="w-full min-h-[120px] text-[15px] text-[#334155] leading-[1.6] font-medium relative z-10 bg-white border border-[#E2E8F0] rounded-xl p-4 outline-none focus:border-[#02022C] resize-y"
                    placeholder="Enter your script here..."
                  />
                ) : (
                  <p className="text-[15px] text-[#334155] leading-[1.6] font-medium relative z-10">
                    {editedScript || campaignData.script || "Script loading..."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Voice & Music Controls */}
          {isDraft && <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voice Selection */}
              <div className="space-y-4">
                <h3 className="text-[12px] font-black text-[#02022C] uppercase tracking-[0.2em]">Neural Voice Casting</h3>
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onSelect={(id) => setSelectedVoice(id)}
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1 leading-relaxed">
                  Active Selection: <span className="text-[#02022C]">{selectedVoiceName}</span>
                </p>
              </div>

              {/* Background Music Prompt */}
              <div className="space-y-4">
                <h3 className="text-[12px] font-black text-[#02022C] uppercase tracking-[0.2em]">Background Music Style</h3>
                <input
                  type="text"
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="e.g., Upbeat electronic music, energetic"
                  className="w-full p-4 bg-white border border-[#E2E8F0] rounded-2xl text-[13px] font-medium text-[#334155] placeholder:text-[#94A3B8] outline-none focus:border-[#02022C] transition-colors"
                />
              </div>
            </div>

            {/* Apply Changes Button */}
            {(isEditingScript || selectedVoice || musicPrompt) && (
              <div className="flex justify-end">
                <button
                  onClick={handleApplyChanges}
                  disabled={isApplyingChanges}
                  className="px-8 py-4 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold text-[13px] uppercase tracking-wider hover:shadow-xl hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isApplyingChanges ? (
                    <>
                      <Icons.Loader className="w-4 h-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Icons.CheckCircle className="w-4 h-4" />
                      Apply Changes & Regenerate
                    </>
                  )}
                </button>
              </div>
            )}
          </>
          }

          {/* HITL Approval Section */}
          {isAwaitingApproval && (
            <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[32px] space-y-6 shadow-sm border-t-4 border-t-[#02022C] animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#02022C] rounded-xl flex items-center justify-center">
                    <Icons.MagicWand className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[14px] font-black text-[#121212] uppercase tracking-widest">AI Consultation</h3>
                    <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-widest">
                      Review {localStatus?.replace("awaiting_approval_", "").replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Asset Candidates - Only show if it's an image step and we have images */}
              {((localStatus?.includes("image") || (isAwaitingApproval && !localStatus?.includes("voice") && !localStatus?.includes("music") && !localStatus?.includes("text") && !localStatus?.includes("render"))) && 
                !localHitl?.music_url && !localStatus?.includes("music")) && 
               ((localHitl?.candidates?.length || localHitl?.image_urls?.length || campaignData?.nodes?.generate_image?.result?.scene_images?.length)) && (
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Select the best generation candidate:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {(localHitl?.candidates || localHitl?.image_urls || campaignData?.nodes?.generate_image?.result?.scene_images || []).map((candidate: any, idx: number) => {
                      const assetUrl = normalizeAssetUrl(candidate.url || candidate.image_url || (typeof candidate === "string" ? candidate : null));
                      const assetId = candidate.id || idx.toString();
                      if (!assetUrl) return null;

                      return (
                        <div
                          key={assetId}
                          onClick={() => setSelectedAssetId(assetId)}
                          className={cn(
                            "relative aspect-video rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group/cand shadow-sm",
                            selectedAssetId === assetId
                              ? "border-[#02022C] ring-4 ring-[#02022C]/10 shadow-lg scale-[1.02]"
                              : "border-white opacity-60 hover:opacity-90 grayscale hover:grayscale-0"
                          )}
                        >
                          <img src={assetUrl} alt={`Option ${idx + 1}`} className="w-full h-full object-contain" />
                          <div className={cn(
                            "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                            selectedAssetId === assetId ? "bg-[#02022C] text-white shadow-md" : "bg-white/60"
                          )}>
                            {selectedAssetId === assetId ? <Icons.CheckCircle className="w-4 h-4" /> : <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />}
                          </div>
                          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-md text-[9px] font-black text-white uppercase tracking-widest opacity-0 group-hover/cand:opacity-100 transition-opacity">
                            Option {idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Voice Generation Preview - Only show if current step is voice generation */}
              {(localStatus?.includes("voice")) && localHitl?.voiceover_url && (
                <div className="space-y-4 p-6 bg-white border border-[#E2E8F0] rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#02022C]/5 rounded-lg flex items-center justify-center">
                      <Icons.Mic className="w-4 h-4 text-[#02022C]" />
                    </div>
                    <p className="text-[11px] font-black text-[#02022C] uppercase tracking-widest">Review Voice Generation</p>
                  </div>
                  <audio src={normalizeAssetUrl(localHitl.voiceover_url)} controls className="w-full h-10" />
                </div>
              )}

              {/* Music Generation Preview - Only show if current step is music generation */}
              {(localStatus?.includes("music") || localHitl?.action === "generate_music" || localHitl?.music_url ) && localHitl?.music_url && !localStatus?.includes("render") &&(
                <div className="space-y-4 p-6 bg-white border border-[#E2E8F0] rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#02022C]/5 rounded-lg flex items-center justify-center">
                      <Icons.Music className="w-4 h-4 text-[#02022C]" />
                    </div>
                    <p className="text-[11px] font-black text-[#02022C] uppercase tracking-widest">Review Background Music</p>
                  </div>
                  <audio src={normalizeAssetUrl(localHitl.music_url)} controls className="w-full h-10" />
                </div>
              )}

              {/* Script/Text Preview - Only show if current step is text generation */}
              {localStatus?.includes("text") && localHitl?.script && (
                <div className="space-y-4 p-6 bg-white border border-[#E2E8F0] rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#02022C]/5 rounded-lg flex items-center justify-center">
                      <Icons.PenLine className="w-4 h-4 text-[#02022C]" />
                    </div>
                    <p className="text-[11px] font-black text-[#02022C] uppercase tracking-widest">Review Generated Script</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-[13px] font-medium text-slate-700 leading-relaxed border border-slate-100">
                    {typeof localHitl.script === 'string' ? localHitl.script : localHitl.script?.script || "No script content available."}
                  </div>
                </div>
              )}

              {/* Video Preview - Only show if current step is rendering */}
              {localStatus?.includes("render") && (localHitl?.video_url || localHitl?.video_urls) && (
                <div className="space-y-4 p-4 bg-white border border-[#E2E8F0] rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#02022C]/5 rounded-lg flex items-center justify-center">
                      <Icons.Play className="w-4 h-4 text-[#02022C]" />
                    </div>
                    <p className="text-[11px] font-black text-[#02022C] uppercase tracking-widest">Review Rendered Video</p>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-black border border-slate-100 shadow-xl relative aspect-video w-full flex items-center justify-center">
                    <video
                      key={localHitl?.video_url || (Array.isArray(localHitl?.video_urls) ? localHitl.video_urls[0] : "no-video")}
                      src={normalizeAssetUrl(localHitl?.video_url || (Array.isArray(localHitl?.video_urls) ? localHitl.video_urls[0] : null))}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* No candidates notice for checkpoints with no visual assets */}
              {(!localStatus?.includes("voice") && !localStatus?.includes("music") && !localStatus?.includes("text") && !localStatus?.includes("render") && !localHitl?.candidates?.length && !localHitl?.image_urls?.length) ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No preview assets for this step</p>
                  <p className="text-[11px] text-slate-400 mt-1">Approve to continue the pipeline or improve to regenerate.</p>
                </div>
              ) : null}

              {/* Feedback / Input Input */}
              <div className="space-y-4">
                {localStatus?.includes("voice") ? (
                  <div className="space-y-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Neural Voice Casting:</p>
                    <VoiceSelector
                      selectedVoice={selectedVoice}
                      onSelect={(id) => setSelectedVoice(id)}
                    />
                    <div className="space-y-2">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Specific Voiceover Instructions (Optional):</p>
                      <textarea
                        value={stepNotes}
                        onChange={(e) => setStepNotes(e.target.value)}
                        placeholder="e.g., Speak faster, more excitement, emphasize 'innovation'..."
                        className="w-full min-h-[80px] p-5 bg-white border border-[#E2E8F0] rounded-[24px] text-[14px] font-medium text-[#121212] outline-none focus:border-[#02022C] transition-all placeholder:text-slate-300 resize-none shadow-inner"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Feedback / Instructions (Optional):</p>
                    <textarea
                      value={stepNotes}
                      onChange={(e) => setStepNotes(e.target.value)}
                      placeholder={localStatus?.includes("image") ? "e.g., Make it more vibrant, change the lighting..." : "e.g., Looks perfect, or requested changes..."}
                      className="w-full min-h-[100px] p-5 bg-white border border-[#E2E8F0] rounded-[24px] text-[14px] font-medium text-[#121212] outline-none focus:border-[#02022C] transition-all placeholder:text-slate-300 resize-none shadow-inner"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleStepAction("approve")}
                  disabled={isProcessingStep}
                  className="flex-1 h-14 bg-[#02022C] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-[#02022C]/20"
                >
                  <Icons.CheckCircle className="w-4 h-4" /> Approve Step
                </button>
                <button
                  onClick={() => handleStepAction("improve")}
                  disabled={isProcessingStep || (localStatus?.includes("image") && !selectedAssetId && !stepNotes.trim())}
                  className="flex-1 h-14 bg-white border border-[#E2E8F0] text-[#02022C] rounded-2xl flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 shadow-xs"
                >
                  <Icons.MagicWand className="w-4 h-4" /> Improve
                </button>
                <button
                  onClick={() => handleStepAction("reject")}
                  disabled={isProcessingStep}
                  className="w-14 h-14 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center justify-center transition-all hover:bg-red-500 hover:text-white active:scale-95 disabled:opacity-50"
                  title="Reject and Stop"
                >
                  <Icons.Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive Chat & Session History */}
          {(showHistory || canChat || localHistory.length > 0) && (
            <div className="space-y-4 pt-4 border-t border-[#F1F5F9]">
              <p className="text-[11px] font-black text-[#02022C] uppercase tracking-[0.2em] opacity-40">
                {showHistory ? "Session Audit Log" : canChat ? "Live Collaboration" : "Session Outcome"}
              </p>
              <div className="bg-[#FDFDFF] border border-[#F1F5F9] rounded-[32px] overflow-hidden flex flex-col shadow-sm">
                <div ref={chatContainerRef} className="p-6 space-y-8 flex flex-col max-h-[450px] overflow-y-auto no-scrollbar will-change-transform">
                  {(() => {
                    const processedHistory = localHistory
                      .map((msg) => {
                        const content = cleanContent(msg.content);
                        const isStatus = msg.content.includes("LAUNCH_CAMPAIGN:") || content.includes("LAUNCH_CAMPAIGN:");
                        
                        if (!content && !isStatus) return null;
                        return { ...msg, content: isStatus ? "LAUNCH_CAMPAIGN_PLACEHOLDER" : content };
                      })
                      .filter((msg): msg is { role: string; content: string; assets?: any[] } => msg !== null);

                    const finalHistory: { role: string; content: string; assets?: any[] }[] = [];
                    processedHistory.forEach((msg) => {
                      const prev = finalHistory[finalHistory.length - 1];
                      if (prev && prev.role === msg.role && prev.content === msg.content) return;
                      if (msg.content === "LAUNCH_CAMPAIGN_PLACEHOLDER" && prev && prev.role === "assistant") return;
                      finalHistory.push(msg);
                    });

                    return finalHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-4 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-400",
                          msg.role === "user" ? "flex-row-reverse ml-auto" : "mr-auto"
                        )}
                      >
                        <div className="relative w-8 h-8 shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                          {msg.role === "user" ? (
                            user?.avatarUrl ? (
                              <Image 
                                src={user.avatarUrl} 
                                alt="User" 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Icons.User className="w-4 h-4 text-slate-400" />
                              </div>
                            )
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Icons.Sparkles className="w-4 h-4 text-[#02022C]" />
                            </div>
                          )}
                        </div>

                        <div className={cn("flex flex-col", msg.role === "user" ? "items-end text-right" : "items-start text-left")}>
                          <div
                            className={cn(
                              "relative px-5 py-3.5 rounded-[24px] text-[13.5px] leading-relaxed shadow-sm transition-all",
                              msg.role === "user"
                                ? "bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-tr-none shadow-[inset_0px_-5px_5px_0px_rgba(79,86,155,0.1)]"
                                : "bg-white text-[#121212] border border-slate-100 rounded-tl-none shadow-[0_4px_12px_-4px_rgba(0,0,0,0.04)]"
                            )}
                          >
                            {msg.content === "LAUNCH_CAMPAIGN_PLACEHOLDER" ? (
                              <span className="flex items-center gap-2 font-black italic text-green-600">
                                🚀 Success! Campaign Launched.
                              </span>
                            ) : (
                              <MarkdownRenderer content={msg.content} isUser={msg.role === "user"} />
                            )}
                            {msg.role !== "user" && msg.content !== "LAUNCH_CAMPAIGN_PLACEHOLDER" && (
                              <button 
                                onClick={() => handleToggleSpeech(msg.content, `${msg.role}-${msg.content.length}-${msg.content.substring(0, 50)}`)}
                                className={cn(
                                  "absolute -right-10 top-0 p-2 transition-all duration-200",
                                  isSpeaking && currentlySpeakingId === `${msg.role}-${msg.content.length}-${msg.content.substring(0, 50)}` 
                                    ? "text-blue-600 scale-110" 
                                    : "text-slate-400 hover:text-[#02022C] hover:scale-110"
                                )}
                                title={isSpeaking && currentlySpeakingId === `${msg.role}-${msg.content.length}-${msg.content.substring(0, 50)}` ? "Stop" : "Play"}
                              >
                                {isSpeechLoading && currentlySpeakingId === `${msg.role}-${msg.content.length}-${msg.content.substring(0, 50)}` ? (
                                  <Icons.Loader className="w-4 h-4 animate-spin text-blue-600" />
                                ) : isSpeaking && currentlySpeakingId === `${msg.role}-${msg.content.length}-${msg.content.substring(0, 50)}` ? (
                                  <Icons.Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Icons.Play className="w-4 h-4 fill-current" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Attached Assets Gallery — only on the first user message */}
                          {i === 0 && msg.role === "user" && msg.assets && msg.assets.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 justify-end">
                              {msg.assets.map((asset: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shadow-sm group/asset cursor-pointer"
                                  onClick={() => window.open(normalizeAssetUrl(asset.url), '_blank')}
                                >
                                  <img 
                                    src={normalizeAssetUrl(asset.url)} 
                                    alt={asset.name || "Asset"} 
                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                              ))}
                            </div>
                          )}

                          <span className="text-[8px] text-slate-400 mt-1.5 font-black uppercase tracking-widest px-1 opacity-60">
                            {msg.role === "user" ? "Client Account" : "AI Director"}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                  {isGenerating && (
                    <div className="mr-auto flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm animate-in slide-in-from-left-2 duration-300">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Buffering...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} className="h-4" />
                </div>

                {/* Chat Input Area */}
                {canChat && !isTerminalMessage && (
                  <div className="p-6 bg-slate-50 border-t border-[#F1F5F9]">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-center gap-3 bg-white border border-slate-200 rounded-[20px] p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#02022C]/5 focus-within:border-[#02022C]/10 transition-all"
                    >
                      <input
                        type="text"
                        placeholder={
                          isDraft
                            ? "Request changes (e.g., 'make the voice more energetic', 'change the music')..."
                            : "Refine values or tell AI Director to 'Launch'..."
                        }
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isGenerating}
                        className="flex-1 bg-transparent px-4 py-2 text-[14px] text-[#121212] outline-none placeholder:text-slate-400 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim() || isGenerating}
                        className="h-11 px-6 bg-[#02022C] text-white rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 font-black text-[12px] uppercase tracking-wider"
                      >
                        Send <Icons.Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F1F5F9] bg-[#FDFDFF] flex items-center justify-between sticky bottom-0">
          <div className="flex flex-col gap-1"></div>
          <div className="flex items-center gap-3">
            {lastAIMsg?.content?.includes("Launching your campaign now") && isDraft && (
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="h-11 px-8 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-px transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isApproving ? (
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Icons.CheckCircle className="w-4 h-4" />
                )}
                Approve
              </button>
            )}
            <button
              onClick={onClose}
              className="h-11 px-8 bg-[#02022C] text-white rounded-xl font-bold text-sm hover:shadow-xl hover:-translate-y-px transition-all"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>

      <ImageViewerModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={selectedImage}
      />
    </div>

  );
}