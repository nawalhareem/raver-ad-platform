"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import QuickCreateCard from "@/components/dashboard/QuickCreateCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { Icons } from "@/components/ui/icons";
import {CustomIcons} from "@/components/ui/custom-icons";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { RaverLoadingState } from "@/components/ui/RaverLoadingState";
import CampaignPreviewModal from "@/components/studio/CampaignPreviewModal";
import { toast } from "react-toastify";

const stats = [
  { label: "Total Projects", value: "24", change: "12%", icon: Icons.Dashboard, trend: "up" as const },
  { label: "Content Generated", value: "1,847", change: "5.2%", icon: Icons.CreativeStudio, trend: "up" as const },
  { label: "Team Members", value: "12", change: "2%", icon: Icons.AIAgents, trend: "up" as const },
  { label: "Credits Remaining", value: "250", change: "10%", icon: Icons.Database, trend: "down" as const },
];

const quickActions = [
  { title: "Create Image", icon: Icons.Image, href: "/agents/image-lead", gradient: "bg-[linear-gradient(90deg,_var(--color-brand-primary)_0%,_var(--color-brand-secondary)_100%)]" },
  { title: "Create Video", icon: Icons.Video, href: "/studio", gradient: "bg-[linear-gradient(135deg,_#F6339A_0%,_#FB2C36_100%)]" },
  { title: "Generate Text", icon: Icons.Text, href: "/chat", gradient: "bg-[linear-gradient(135deg,_#00C950_0%,_#00BC7D_100%)]" },
  { title: "Start AI Project", icon: Icons.MagicWand, href: "/agents", gradient: "bg-[linear-gradient(135deg,_#FF6900_0%,_#F0B100_100%)]" },
  { title: "Open Template", icon: CustomIcons.Templates, href: "/templates", gradient: "bg-[linear-gradient(90deg,_var(--color-brand-primary)_0%,_var(--color-brand-secondary)_100%)]" },
];

const recentProjects = [
  { 
    title: "Summer Campaign 2024", 
    time: "2 hours", 
    members: 3, 
    image: "/assets/f3866e13f8851b89b6d19d9a6186e137dbe58fcc.jpg" 
  },
  { 
    title: "Social Media Content", 
    time: "5 hours", 
    members: 1, 
    image: "/assets/6a42346bb1ab28815fb6775ac20c4470feb95d78.jpg" 
  },
  { 
    title: "Website Redesign", 
    time: "1 hour", 
    members: 5, 
    image: "/assets/f3866e13f8851b89b6d19d9a6186e137dbe58fcc.jpg" 
  },
];

export default function HomePage() {
  const [dashboardProjects, setDashboardProjects] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    // Attempt to fetch live data from the backend
    const fetchDashboardData = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        // Fetch AI Director Sessions (AI Creative)
        const response = await apiFetch(`${API_BASE}/ai/director/sessions?t=${Date.now()}`, {
          cache: "no-store"
        });
        
        if (response.ok) {
          const result = await response.json();
          const rawData = Array.isArray(result.data?.sessions) ? result.data.sessions : (result.sessions || result.data);
          
          if (Array.isArray(rawData)) {
            // STRICT FILTER: Only include Studio sessions with a valid session_id
            const sessionsOnly = rawData.filter((s: any) => s.session_id);

            // Sort by creation date and take latest 3
            const sorted = sessionsOnly.sort((a, b) => {
               const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
               const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
               return tB - tA;
            });

            const mappedProjects = sorted.slice(0, 3).map((s: any) => ({
              id: s.campaign_id || s.id,
              session_id: s.session_id || s.id,
              title: s.title || (s.brief_draft?.business_name ? `${s.brief_draft.business_name} Active Simulation` : `Studio Session ${s.session_id || s.id}`),
              status: s.status || "ready",
              message: s.message || s.prompt,
              video_url: s.video_url,
              voiceover_url: s.voiceover_url,
              music_url: s.music_url,
              script: s.script,
              history: s.history,
              brief_draft: s.brief_draft,
              prompt: s.prompt,
              voice_id: s.voice || s.voice_id || s.brief_draft?.voice || s.production?.voice || s.metadata?.voice || "adam",
              image: s.image_urls?.length ? s.image_urls : (s.nodes?.generate_image?.result?.scene_images?.length ? s.nodes.generate_image.result.scene_images : "/assets/hashtag-campaign.jpg"),
              created_at: s.created_at,
              time: s.created_at ? "Recently" : "Just now"
            }));

            setDashboardProjects(mappedProjects);

            // Update stats based on live STUDIO data only
            setDashboardStats(prev => [
              { ...prev[0], value: sessionsOnly.length.toString() }, // Total Studio Projects
              { ...prev[1], value: sessionsOnly.filter((p: any) => p.status === 'completed' || p.status === 'delivered').length.toString() }, // Content Generated
              prev[2],
              prev[3]
            ]);
          }
        }
    } finally {
      setIsProjectsLoading(false);
    }
  };
  fetchDashboardData();
}, []);

  if (isProjectsLoading) return <RaverLoadingState title="Loading Workspace" description="Checking agent statuses and gathering your dashboard activity..." />;

  return (
    <DashboardLayout>
      <div className="flex flex-col bg-[#FFFFFF] gap-[16px] rounded-[12px]  mx-auto p-[16px]">
        {/* Welcome Section */}
        <div className="flex flex-col gap-[2px]">
          <h1 className="text-[30px] font-bold text-[#121212]">
            Welcome back, {user?.fullName?.split(' ')[0] || "there"}!
          </h1>
          <p className="text-[16px] text-[#4F4F4F]">Here&apos;s an overview of your workspace.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, i) => (
            <StatsCard key={i} {...stat} />
          ))}
        </div>

        {/* Quick Create Section */}
        <div className="flex flex-col gap-[12px]">
          <h2 className="text-[18px] font-medium text-[#02022C]">Quick Create</h2>
          <div className="flex flex-wrap gap-[9px]">
            {quickActions.map((action, i) => (
              <QuickCreateCard key={i} {...action} />
            ))}
          </div>
        </div>

        {/* Active Campaigns Section */}
        <div className="flex flex-col gap-[12px]">
          <div className="items-center justify-between flex">
            <h2 className="text-[18px] font-bold text-[#121212]">Active Campaigns</h2>
            <Link href="/projects" className="text-[14px] font-semibold text-[#02022C] hover:underline flex items-center gap-2">
              View All <Icons.ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isProjectsLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-[8px] bg-slate-50/50 rounded-[12px] border border-slate-100 animate-pulse h-[340px] flex flex-col gap-4">
                     <div className="w-full aspect-video bg-slate-200 rounded-lg" />
                     <div className="flex-1 space-y-3 px-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="mt-8 h-10 bg-slate-200 rounded-xl" />
                     </div>
                  </div>
               ))
            ) : dashboardProjects.length > 0 ? (
              dashboardProjects.map((project, i) => (
                <ProjectCard 
                  key={i} 
                  {...project} 
                  image={project.image}
                  videoUrl={project.video_url}
                  members={1}
                  onPreview={() => {
                    setActiveCampaign(project);
                    setIsPreviewOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                 <Icons.MagicWand className="w-10 h-10 text-slate-300 mb-4" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active campaigns found</p>
                 <Link href="/agents" className="text-blue-500 font-bold text-xs mt-2 hover:underline">Start a new campaign</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <CampaignPreviewModal 
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          campaignData={activeCampaign ? {
            ...activeCampaign,
            session_id: activeCampaign.session_id,
            campaign_id: activeCampaign.id
          } : null}
          onRefresh={() => {
             // Re-fetch data if needed
          }}
      />
    </DashboardLayout>
  );
}
