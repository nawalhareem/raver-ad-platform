import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface CampaignHistoryListProps {
  history: any[];
  onDelete?: (id: string) => void;
}

export function CampaignHistoryList({ history, onDelete }: CampaignHistoryListProps) {
  if (!history.length) return null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
            <Icons.Files className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-brand-primary tracking-normal lowercase leading-none">Production Audits</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
          <span className="text-[10px] font-black text-slate-400">{history.length}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Records</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {history.map((campaign) => (
          <div
            key={campaign.id}
            className="group bg-white rounded-[32px] border border-slate-100 p-8 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col relative overflow-hidden"
          >
            {/* Subtle card highlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />

            {/* Header Section */}
            <div className="flex items-center justify-between relative z-10 mb-6">
              <div className="flex flex-col gap-1">
                <h4 className="text-xl font-black text-brand-primary tracking-normal lowercase">{campaign.name || "unnamed_brief"}</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                  campaign.status === "delivered" || campaign.status === "completed" || campaign.status === "ready_for_human_review"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-slate-50 text-brand-primary border-slate-100"
                )}>
                  {campaign.status}
                </div>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(campaign.id);
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                    title="Delete Audit"
                  >
                    <Icons.Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Section - Grow to push footer down */}
            <div className="flex flex-col gap-6 relative z-10 mb-8 grow">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-normal">Timeline</span>
                <span className="text-[11px] font-bold text-[#0A0A0A] italic">
                  {new Date(campaign.createdAt || campaign.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-normal">ID Matrix</span>
                <span className="text-[10px] font-black text-brand-primary truncate">{campaign.id.split('-')[0]}</span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="relative z-10 pt-2">
              <Link
                href={`/agents/producer/campaign/${campaign.id}`}
                className="w-full h-12 bg-linear-to-r from-brand-primary to-brand-secondary text-white rounded-2xl flex items-center justify-between px-6 transition-all hover:bg-brand-secondary active:scale-95 group/btn"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Review Full Audit</span>
                <Icons.ArrowRight className="w-4 h-4 text-white/50 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 