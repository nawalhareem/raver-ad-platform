"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

import { LaunchBriefForm } from "@/components/producer/LaunchBriefForm";
import { ProducerModal } from "@/components/producer/ProducerModal";
import { LiveProductionTracker } from "@/components/producer/LiveProductionTracker";
import { CampaignHistoryList } from "@/components/producer/CampaignHistoryList";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

function ProducerContent() {
  const searchParams = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaigns`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setHistory(data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch campaign history:", err);
    }
    return [];
  };

  const fetchCampaignStatus = async (id: string) => {
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaign/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setActiveCampaign(data.data);

          // If the campaign is completed or failed, refresh the history and stop polling
          if (data.data.status === "completed" || data.data.status === "delivered" || data.data.status === "failed") {
            fetchHistory();
            return false; // Stop polling
          }
          return true; // Continue polling
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch status for campaign ${id}:`, err);
    }
    return true;
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchHistory();
      setIsSyncing(false);
    };
    init();
  }, []);

  // Polling for active campaign
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCampaign && (activeCampaign.status === "queued" || activeCampaign.status === "in_production")) {
      interval = setInterval(() => {
        fetchCampaignStatus(activeCampaign.campaign_id || activeCampaign.id);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCampaign?.campaign_id, activeCampaign?.id, activeCampaign?.status]);

  const handleLaunch = async (formData: any) => {
    setIsLoading(true);
    try {
      const payload = {
        brief: { ...formData, animate_scenes: true },
        session_id: `raver_prod_${new Date().getTime()}`
      };

      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setActiveCampaign(data.data);
          setIsModalOpen(false);
          await fetchHistory(); // Refresh list immediately
          window.location.reload(); // Hard reload as requested
        }
      } else {
        alert("Launch failed: Matrix infrastructure busy.");
      }
    } catch (err) {
      console.error("Launch error:", err);
      alert("Launch error: Neural thread synchronization failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const campaign = history.find(c => (c.id || c.campaign_id) === id);
    setCampaignToDelete(campaign);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    const id = campaignToDelete.id || campaignToDelete.campaign_id;
    setIsDeleting(true);
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/producer/campaign/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setHistory(prev => prev.filter(c => (c.id || c.campaign_id) !== id));
        if (activeCampaign && (activeCampaign.id === id || activeCampaign.campaign_id === id)) {
           setActiveCampaign(null);
        }
        setIsDeleteModalOpen(false);
      } else {
        alert("Failed to delete campaign.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting campaign.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isSyncing) {
    return (
      <RaverLoadingState
        title="Calibrating Neural Producer"
        description="Synchronizing Matrix infrastructure and preparing high-fidelity Kling AI configuration..."
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white relative overflow-hidden rounded-[10px]">
        {/* Subtle Mesh Background Orchestration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-white/5 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%]   blur-[100px] rounded-full" />
        </div>

        <div className="flex flex-col gap-8 sm:gap-12 p-4 sm:p-10 mx-auto relative z-10 max-w-[1600px]">
          {/* Header - Orchestration Hub */}
          <div className="flex flex-col gap-8 p-6 sm:p-10 rounded-[40px] ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <Link
                    href="/agents"
                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 hover:border-slate-300 shadow-sm transition-all"
                  >
                    <Icons.ArrowLeft className="w-5 h-5 text-brand-primary" />
                  </Link>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-[30px] font-bold text-[#121212] tracking-normal lowercase leading-none">Raver Producer</h1>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="h-14 px-10 border border-slate-100 rounded-[24px] font-black text-xs flex items-center gap-3 transition-all bg-linear-to-r from-brand-primary to-brand-secondary text-white hover:border-transparent active:scale-95 group shadow-xl shadow-black/5"
                >
                  <Icons.Plus className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
                  <span className="uppercase tracking-widest text-[11px]">Initiate Master Production</span>
                </button>

              </div>
            </div>
          </div>


          {/* Archive Matrix - Dossier Feed */}
          <div className="pt-8">
            <CampaignHistoryList
              history={history}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Orchestration Suite Modal Overlay */}
        {isModalOpen && (
          <ProducerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onLaunch={handleLaunch}
            isLoading={isLoading}
            activeCampaign={activeCampaign}
          />
        )}

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Production"
          message={`Are you sure you want to delete "${campaignToDelete?.name || 'this production'}"? This will permanently remove the audit and all associated assets.`}
          confirmText="Delete Production"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}

export default function ProducerPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[600px]">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#0A0A0A] rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Initializing Matrix...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <ProducerContent />
    </Suspense>
  );
}
