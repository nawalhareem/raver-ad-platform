"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { apiFetch } from "@/lib/api";
import { QualityCandidates } from "@/components/agents/quality-lead/QualityCandidates";
import { QualityHistory } from "@/components/agents/quality-lead/QualityHistory";
import { QualityAuditModal } from "@/components/agents/quality-lead/QualityAuditModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";

export default function QualityLeadPage() {
  const [candidates, setCandidates] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feed" | "history">("feed");
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://apiplatform.raver.ai/api";

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/ai/quality/candidates`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCandidates(data.data);
        }
      } else {
        toast.error("Failed to synchronize quality candidates.");
      }
    } catch (err) {
      console.warn("Candidates fetch failed:", err);
      toast.error("Orchestration pipeline failure. Retrying...");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/ai/quality/history`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHistory(data.data || []);
        }
      }
    } catch (err) {
      console.warn("History fetch failed:", err);
    }
  };

  const refreshAll = () => {
    fetchCandidates();
    fetchHistory();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const stats = React.useMemo(() => {
    if (!candidates && history.length === 0) return { pending: 0, rejections: 0, accuracy: 0, violations: 0 };
    
    // Calculate pending from all nested arrays in candidates object
    const pending = candidates ? Object.values(candidates).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0) : 0;
    
    // Calculate history-based stats
    const rejections = history.filter(h => h.decision === "rejected" || h.rejected).length;
    const violations = history.filter(h => h.rejectReason?.toLowerCase().includes("brand") || h.metadata?.reject_reason?.toLowerCase().includes("brand")).length;
    
    const validScores = history.filter(h => (h.overallScore || h.metadata?.overall_score) > 0).map(h => h.overallScore || h.metadata?.overall_score);
    const avgAccuracy = validScores.length > 0 
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100 
      : 98.8;

    return { 
      pending, 
      rejections, 
      accuracy: avgAccuracy.toFixed(1),
      violations
    };
  }, [candidates, history]);

  const handleAudit = (candidate: any) => {
    setSelectedCandidate(candidate);
    setIsAuditModalOpen(true);
  };

  const handleDeleteReport = (id: string) => {
    const report = history.find(h => h.id === id || h.reportId === id);
    setReportToDelete(report);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;
    const id = reportToDelete.id || reportToDelete.reportId;
    setIsDeleting(true);
    try {
      const response = await apiFetch(`${API_BASE}/ai/quality/report/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Governance report archived successfully.");
        setIsDeleteModalOpen(false);
        refreshAll();
      } else {
        toast.error("Failed to archive governance report.");
      }
    } catch (err) {
      console.error("Delete report failed:", err);
      toast.error("Network synchronization failure.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <RaverLoadingState title="Loading Quality Metrics" description="Calculating neural integrity and brand alignment scores..." />;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 p-6 sm:p-10 bg-white rounded-[40px] min-h-screen">
        {/* Quality Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/agents" 
              className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 group shadow-sm"
            >
              <Icons.ArrowLeft className="w-5 h-5 text-brand-primary group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div className="flex flex-col">
               <h1 className="text-[34px] font-black text-brand-primary tracking-normal lowercase leading-none">RAVER QUALITY LEAD</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/30 mt-3">Neural Integrity & Brand Alignment Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Audit Rate</span>
              <span className="text-[16px] font-black text-brand-primary">{history.length > 0 ? "100%" : "0%"}</span>
            </div>
            <button 
              onClick={refreshAll}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-brand-primary hover:bg-slate-100 transition-all active:rotate-180"
            >
              <Icons.RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: "Candidates Pending", value: stats.pending, icon: Icons.Activity, color: "text-blue-500" },
             { label: "Neural Audits", value: history.length, icon: Icons.ShieldCheck, color: "text-emerald-500" },
             { label: "Rejections", value: stats.rejections, icon: Icons.AlertTriangle, color: "text-amber-500" },
             { label: "Synthesis Accuracy", value: `${stats.accuracy}%`, icon: Icons.Layers, color: "text-purple-500" }
           ].map((stat, i) => (
             <div key={i} className="bg-slate-50 border border-[#F1F5F9] rounded-[28px] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <div className="text-2xl font-black text-brand-primary">{stat.value}</div>
             </div>
           ))}
        </div>

        <div className="h-px bg-slate-100 w-full my-4" />

        {/* Main Interface */}
        <div className="flex-1 space-y-8">
           <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-6">
               <button 
                 onClick={() => setActiveTab("feed")}
                 className={cn(
                   "text-[12px] font-black uppercase tracking-[0.2em] transition-all pb-2 border-b-2",
                   activeTab === "feed" ? "text-blue-500 border-blue-500" : "text-slate-300 border-transparent hover:text-slate-400"
                 )}
               >
                 Candidate Feed
               </button>
               <button 
                 onClick={() => setActiveTab("history")}
                 className={cn(
                   "text-[12px] font-black uppercase tracking-[0.2em] transition-all pb-2 border-b-2",
                   activeTab === "history" ? "text-blue-500 border-blue-500" : "text-slate-300 border-transparent hover:text-slate-400"
                 )}
               >
                 Audit History
               </button>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {activeTab === "feed" ? "Active Synthesis Candidate Feed" : "Archival Integrity Vault"}
               </h3>
             </div>
           </div>
 
           {activeTab === "feed" ? (
             <QualityCandidates 
               candidates={candidates} 
               isLoading={isLoading} 
               onAudit={handleAudit} 
             />
           ) : (
             <QualityHistory 
               history={history} 
               onViewReport={(record) => handleAudit(record)} 
               onDelete={handleDeleteReport}
             />
           )}
        </div>
      </div>

      <QualityAuditModal 
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedCandidate(null);
        }}
        onRefresh={refreshAll}
        candidate={selectedCandidate}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteReport}
        title="Archive Governance Report"
        message={`Are you sure you want to permanently remove the neural report for "${reportToDelete?.campaignId || 'this production'}"? This action cannot be undone.`}
        confirmText="Archive Report"
        variant="danger"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
