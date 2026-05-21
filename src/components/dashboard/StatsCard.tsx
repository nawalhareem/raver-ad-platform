import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
}

export default function StatsCard({ label, value, change, icon: Icon, trend = "up" }: StatsCardProps) {
  const cleanedChange = change.replace(/^[+-]/, "");
  return (
    <div className="bg-[#F8F8F8] px-[21px] pt-[21px] rounded-[8px]  min-w-[230px] h-[98px] border-[0.35px] border-[#0000000D] flex flex-col gap-[8px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-normal text-[#4F4F4F]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-1 justify-between pb-px">
        <span className="text-[24px] font-bold text-[#02022C]">{value}</span>
        <span className={cn(
          "text-[12px] font-bold px-2 py-0.5 rounded-full bg-opacity-10",
          trend === "up" ? "text-[#02022C]" : "text-[#4F4F4F]"
           )}>
          {trend === "up" ? "+" : "-"}{cleanedChange}
        </span>
      </div>
    </div>
  );
}
