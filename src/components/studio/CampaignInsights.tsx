"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Insight {
  label: string;
  value: string | number;
  change?: string;
}

interface CampaignInsightsProps {
  insights: Insight[];
}

export function CampaignInsights({ insights }: CampaignInsightsProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 bg-[#FFFFFF] border-[0.35px] border-[#0000001A] rounded-[12px] p-[16px]">
      <h2 className="text-[18px] font-medium text-[#121212]">Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, i) => {
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
          
          // Specific case: Avg Render Time decrease is positive (good)
          const isGoodChange = (hasPlus && !insight.label.toLowerCase().includes("time")) || 
                              (hasMinus && insight.label.toLowerCase().includes("time"));

          return (
            <div
              key={i}
              className="bg-[#F8F8F8] p-5 rounded-[8px] border-[0.35px] border-[#0000001A] shadow-sm flex flex-col gap-2"
            >
              <span className="text-[12px] text-[#4F4F4F] font-medium">
                {insight.label}
              </span>
              <div className="flex items-end justify-between">
                <span className="text-[24px] font-bold text-[#02022C] leading-none">
                  {displayValue}
                </span>
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
