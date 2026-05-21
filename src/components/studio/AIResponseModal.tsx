"use client";

import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { cn, enrichMessageWithCampaign, normalizeAssetUrl, formatFileSize } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import ProductionPipeline from "./ProductionPipeline";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  assets?: any[];
}

interface AIResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserMessage: string;
  initialAIResponse: string;
  sessionId: string;
  initialHistory?: { role: string; content: string; assets?: any[] }[] | null;
  selectedCampaign?: any | null;
  onCampaignStart?: (campaign: any) => void;
  initialUserAssets?: any[];
}

import { useUser } from "@/context/UserContext";

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

export default function AIResponseModal({
  isOpen,
  onClose,
  initialUserMessage,
  initialAIResponse,
  sessionId,
  initialHistory,
  selectedCampaign,
  onCampaignStart,
  initialUserAssets
}: AIResponseModalProps) {
  console.log(`[AIResponseModal] Rendered. isOpen:`, isOpen);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Voice input for chat
  const handleVoiceResult = useCallback((text: string) => {
    setInputText((prev) => (prev + " " + text).trim());
  }, []);
  const { isListening, interimText, startListening, stopListening } = useVoiceInput(handleVoiceResult);
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isSpeechLoading, isMuted, setIsMuted } = useTextToSpeech();
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

    const lastAIMessage = [...messages].reverse().find(m => m.role === "ai");
    if (!lastAIMessage) return;

    const isNewMessage = lastSpokenMessageId.current !== lastAIMessage.id;

    if (!isMuted && isNewMessage) {
      const cleaned = cleanContent(lastAIMessage.content);
      console.log(`[AIResponseModal] Auto-speaking message ${lastAIMessage.id}:`, cleaned);
      speak(cleaned);
      lastSpokenMessageId.current = lastAIMessage.id;
      setCurrentlySpeakingId(lastAIMessage.id);
    } else if (isMuted) {
      stopSpeaking();
      lastSpokenMessageId.current = null;
      setCurrentlySpeakingId(null);
    }
  }, [isMuted, isOpen, messages, speak, stopSpeaking]);

  // Sync isSpeaking state back to currentlySpeakingId
  useEffect(() => {
    if (!isSpeaking) {
      setCurrentlySpeakingId(null);
    }
  }, [isSpeaking]);

  const handleToggleSpeech = (messageId: string, content: string) => {
    const cleaned = cleanContent(content);
    if (isSpeaking && currentlySpeakingId === messageId) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      speak(cleaned);
      setCurrentlySpeakingId(messageId);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Display value includes interim (not-yet-committed) speech
  const chatDisplayValue = inputText + (interimText ? " " + interimText : "");

  // Auto-resize textarea with a max height limit
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 160; // Limit dynamic expansion to 160px
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.style.overflowY = "hidden";
      }
    }
  }, [chatDisplayValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const lastAIMessage = [...messages].reverse().find(m => m.role === "ai");
  const isTerminalMessage = lastAIMessage?.content?.includes("Your image is queued — generation has started!") ||
    lastAIMessage?.content?.includes("Launching your campaign now") || 
    lastAIMessage?.content?.includes("Your music track is queued — generation has started! I'll let you know when it's ready.") ||
    lastAIMessage?.content?.includes("Campaign started! I'll update you");

  const isInputDisabled = isGenerating || isTerminalMessage;

  // Initialize messages when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (initialHistory && initialHistory.length > 0) {
        // Load from existing history
        const historicalMessages: Message[] = initialHistory.map((m: { role: string; content: string }, i: number) => {
          let content = m.content;
          // Robustly parse JSON-wrapped responses if they exist in history
          if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
            try {
              const parsed = JSON.parse(content);
              content = parsed.response || parsed.message || parsed.ai_message || content;
            } catch (e) { /* fallback to raw content */ }
          }

          return {
            id: `hist-${i}-${Date.now()}`,
            role: (m.role === "assistant" || m.role === "ai") ? "ai" : "user",
            content: content,
            timestamp: new Date(),
            assets: (m as any).assets
          };
        });
        setMessages(historicalMessages);
      } else if (initialUserMessage && initialAIResponse) {
        // Fallback to initial exchange
        setMessages([
          {
            id: "initial-user",
            role: "user",
            content: initialUserMessage,
            timestamp: new Date(),
            assets: initialUserAssets || []
          },
          {
            id: "initial-ai",
            role: "ai",
            content: initialAIResponse,
            timestamp: new Date()
          }
        ]);
      }
    } else if (!isOpen) {
      setMessages([]);
      setInputText("");
      setIsGenerating(false);
      stopListening();
    }
  }, [isOpen, initialUserMessage, initialAIResponse, initialHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating || !sessionId) return;

    const userMsgContent = inputText.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsgContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsGenerating(true);
    stopListening();

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Enrich follow-up message with campaign context and assets if available
      let apiMessage = enrichMessageWithCampaign(userMsg.content, selectedCampaign);

      const currentAssets = initialUserAssets || [];
      if (currentAssets.length > 0) {
        const assetListStr = currentAssets.map(a => {
          const metadataStr = a.rawMetadata ? ` (Original Prompt: ${a.rawMetadata.title || "N/A"})` : "";
          const sizeStr = typeof a.fileSize === 'number' ? formatFileSize(a.fileSize) : (a.fileSize || "Unknown");
          return `- **${a.name}** (${a.type})\n  URL: ${a.url}\n  Size: ${sizeStr}${metadataStr}`;
        }).join("\n\n");
        apiMessage = `${apiMessage}\n\n### ATTACHED MEDIA CONTEXT ###\n${assetListStr}\n---`;
      }

      const response = await apiFetch(`${API_BASE}/ai/director/chat?t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: apiMessage,
          assets: currentAssets,
          professional_name: user?.fullName || "User",
          tag: "director"
        }),
      });

      if (!response.ok) throw new Error("AI Director Communication Failed");
      const data = await response.json();

      // Robustly extract from potentially array-wrapped or nested data
      const responseData = Array.isArray(data?.data) ? data.data[0] : (data?.data || data);
      const aiResponseContent = responseData?.response || responseData?.message || responseData?.ai_message || "I'm still processing your request. How else can I help?";

      const campaignStatus = responseData?.campaign_status;
      const action = responseData?.action;

      if (campaignStatus === "queued" || campaignStatus === "in_production" || action === "generate_image") {
        const brief = responseData?.brief_draft || {};
        const title = brief.business_name ? `${brief.business_name} Campaign` : userMsgContent.length > 30 ? userMsgContent.substring(0, 30) + "..." : userMsgContent;
        if (onCampaignStart) {
          onCampaignStart({
            id: responseData?.campaign_id,
            sessionId: sessionId,
            title: title,
            status: (action === "generate_image" && responseData?.image_urls?.length) ? "completed" : (campaignStatus || "completed"),
            image: responseData?.image_urls?.length ? responseData.image_urls : "/assets/hashtag-campaign.jpg",
            format: brief.format || responseData?.format
          });
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: aiResponseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);

      // Sync to localStorage history to match ChatPage
      const existingSessionsStr = localStorage.getItem("chat_sessions");
      if (existingSessionsStr) {
        try {
          const sessions = JSON.parse(existingSessionsStr);
          const updatedSessions = sessions.map((s: any) => {
            if (s.id === sessionId) {
              return {
                ...s,
                messages: [...s.messages,
                { ...userMsg, timestamp: userMsg.timestamp.toISOString() },
                { ...aiMsg, timestamp: aiMsg.timestamp.toISOString() }
                ]
              };
            }
            return s;
          });
          localStorage.setItem("chat_sessions", JSON.stringify(updatedSessions));
        } catch (e) {
          console.error("Failed to sync modal chat to history", e);
        }
      }

    } catch (err) {
      console.error("Modal Chat Error:", err);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "ai",
        content: "Sorry, I lost my connection for a moment. Please try sending your message again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white w-full max-w-[650px] h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#02022C] rounded-xl flex items-center justify-center shadow-lg shadow-[#02022C]/10">
              <Icons.MagicWand className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[17px] font-bold text-[#121212]">AI Director Chat</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider">Active Consultation</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-2 rounded-full transition-colors group",
                !isMuted ? "bg-blue-50 text-blue-600" : "hover:bg-[#F1F5F9] text-[#94A3B8]"
              )}
              title={!isMuted ? "Mute Speech" : "Unmute Speech"}
            >
              {!isMuted ? <Icons.Volume2 className="w-5 h-5" /> : <Icons.Mute className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors group cursor-pointer"
            >
              <Icons.Plus className="w-5 h-5 rotate-45 text-[#94A3B8] group-hover:text-[#121212]" />
            </button>
          </div>
        </div>

        {/* Chat History Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar bg-[#FDFDFF]"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex items-start gap-4 max-w-[85%]",
                m.role === "user" ? "flex-row-reverse ml-auto" : "mr-auto"
              )}
            >
              <div className={cn(
                "relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-100 shadow-sm flex items-center justify-center",
                m.role === "ai" ? "bg-[#02022C]" : "bg-[#F1F5F9]"
              )}>
                {m.role === "user" ? (
                  user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="User"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <Icons.User className="w-5 h-5 text-slate-400" />
                    </div>
                  )
                ) : (
                  <Image alt="AI" src="/assets/ai-assistant-avatar.png" width={32} height={32} className="object-cover" />
                )}
              </div>
              <div className={cn(
                "flex flex-col",
                m.role === "user" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-all",
                  m.role === "user"
                    ? "bg-[linear-gradient(90deg,var(--color-brand-primary)_0%,var(--color-brand-secondary)_100%)] text-white rounded-tr-none shadow-[inset_0px_-5px_5px_0px_#4F569B]"
                    : "bg-white text-[#121212] border border-slate-100 rounded-tl-none shadow-[0_4px_12px_-4px_rgba(0,0,0,0.04)]"
                )}>
                  {(() => {
                    let content = m.content;
                    if (m.role === "ai") {
                      if (content.includes("[USER MESSAGE]:")) {
                        content = content.split("[USER MESSAGE]:").pop() || content;
                      }
                      const trimmed = content.trim();
                      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                        try {
                          const parsed = JSON.parse(trimmed);
                          content = parsed.response || parsed.message || parsed.ai_message || content;
                        } catch (e) { /* fallback to original content if parse fails */ }
                      }
                    }
                    return <MarkdownRenderer content={content.trim()} isUser={m.role === "user"} />;
                  })()}
                  {m.role === "ai" && (
                    <button
                      onClick={() => handleToggleSpeech(m.id, m.content)}
                      className={cn(
                        "absolute -right-10 top-0 p-2 transition-all duration-200",
                        isSpeaking && currentlySpeakingId === m.id
                          ? "text-blue-600 scale-110"
                          : "text-slate-400 hover:text-[#02022C] hover:scale-110"
                      )}
                      title={isSpeaking && currentlySpeakingId === m.id ? "Stop" : "Play"}
                    >
                      {isSpeechLoading && currentlySpeakingId === m.id ? (
                        <Icons.Loader className="w-4 h-4 animate-spin text-blue-600" />
                      ) : isSpeaking && currentlySpeakingId === m.id ? (
                        <Icons.Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Icons.Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  )}
                </div>

                {/* Attached Assets Gallery */}
                {m.assets && m.assets.length > 0 && (
                  <div className={cn(
                    "flex flex-wrap gap-2 mt-2",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}>
                    {m.assets.map((asset: any, idx: number) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm group/asset cursor-pointer"
                        onClick={() => window.open(normalizeAssetUrl(asset.url), '_blank')}
                      >
                        <img
                          src={normalizeAssetUrl(asset.url)}
                          alt={asset.name || "Asset"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
                <span className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest px-1">
                  {m.role === "user" ? "YOU" : "AI DIRECTOR"} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTerminalMessage && (
            <div className="mt-4 mb-8 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-[#02022C] uppercase tracking-wider">Production Track</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">Real-time status</span>
              </div>
              {(() => {
                const inferredMediaType = selectedCampaign?.format || 
                  (initialUserMessage?.toLowerCase().includes("video") || initialUserMessage?.toLowerCase().includes("campaign") ? "video" : 
                   initialUserMessage?.toLowerCase().includes("music") || initialUserMessage?.toLowerCase().includes("track") ? "music" : 
                   initialUserMessage?.toLowerCase().includes("image") || initialUserMessage?.toLowerCase().includes("visual") ? "image" : "video");

                return (
                  <ProductionPipeline 
                    status="in_production" 
                    message={lastAIMessage?.content || ""}
                    campaignStatus="in_production"
                    className="p-0 py-2"
                    mediaType={inferredMediaType}
                  />
                );
              })()}
            </div>
          )}

          {isGenerating && (
            <div className="mr-auto max-w-[80%] flex items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="w-8 h-8 rounded-xl bg-[#02022C] border border-slate-200 overflow-hidden flex items-center justify-center relative">
                <Icons.Loader className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Buffering...</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Input Bottom */}
        <div className="p-6 bg-white border-t border-[#F1F5F9]">
          <form
            ref={formRef}
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shadow-inner transition-all focus-within:ring-2 focus-within:ring-[#02022C]/5 focus-within:border-[#02022C]/10"
          >
            {/* Mic Button */}
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isInputDisabled}
              className={`h-[44px] w-[44px] shrink-0 rounded-xl flex items-center justify-center transition-all ${isListening
                ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                : isInputDisabled
                  ? "bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed"
                  : "bg-white text-[#94A3B8] hover:text-[#121212] hover:bg-[#F1F5F9] border border-slate-200"
                }`}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              <Icons.Mic className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isTerminalMessage
                    ? "Production started. Tracking progress..."
                    : isListening
                      ? "Listening... speak now"
                      : "Ask your AI Director a follow-up question..."
                }
                value={chatDisplayValue}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled}
                className={cn(
                  "w-full min-w-0 bg-transparent py-2.5 text-[14px] text-[#121212] outline-none placeholder:text-slate-400 font-medium disabled:cursor-not-allowed pl-3 transition-all resize-none overflow-y-hidden leading-relaxed block",
                  isListening ? "pr-16" : "pr-3"
                )}
              />
              {isListening && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold animate-pulse">
                  ● REC
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isInputDisabled}
              className="h-[44px] px-6 shrink-0 bg-[#02022C] text-white rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-[#02022C]/10 font-bold"
            >
              Ask <Icons.Send className="w-4 h-4 ml-1 text-white" />
            </button>
          </form>
          <p className="text-[11px] text-center text-[#94A3B8] mt-3 font-medium">
            Responses are saved to your chat history automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
