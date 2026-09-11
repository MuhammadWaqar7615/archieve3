"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconBgColor?: string;
  iconTextColor?: string;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = "vs prev period",
  iconBgColor,
  iconTextColor,
  subtitle,
  className,
}: StatCardProps) {
  const formattedVal = typeof value === "number" ? formatNumber(value) : value;

  // Monochrome defaults when color props are omitted
  const bgStyle = iconBgColor || "bg-transparent p-0";
  const textStyle = iconTextColor || "text-[#1B2935]";

  return (
    <div
      className={cn(
        "p-4 sm:p-5 bg-white rounded-xl border border-[#E6E8EC] flex flex-col justify-between min-h-[105px] transition duration-150 hover:border-slate-300",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("rounded-lg flex items-center justify-center shrink-0", bgStyle)}>
          <Icon className={cn("w-5 h-5", textStyle)} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-[#1B2935] font-mono tracking-tight">
          {formattedVal}
        </div>
        <div className="text-xs font-semibold text-[#6B7280] mt-0.5">
          {title}
        </div>

        {/* Optional trend / subtitle line for Notification Statistics compatibility */}
        {(trend !== undefined || subtitle) && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#6B7280]">
            {trend !== undefined ? (
              <div className="flex items-center gap-1">
                {trend > 0 ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />+{trend}%
                  </span>
                ) : trend < 0 ? (
                  <span className="font-bold text-rose-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />{trend}%
                  </span>
                ) : (
                  <span className="font-bold text-slate-500 flex items-center gap-0.5">
                    <Minus className="w-3 h-3" />0%
                  </span>
                )}
                <span>{trendLabel}</span>
              </div>
            ) : (
              <span>{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
