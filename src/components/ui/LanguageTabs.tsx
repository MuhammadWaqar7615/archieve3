"use client";

import React from "react";
import { LanguageCode } from "@/types";
import { cn } from "@/lib/utils";

interface LanguageTabsProps {
  activeTab: LanguageCode;
  onChangeTab: (code: LanguageCode) => void;
  onCopyEnglish: () => void;
}

export function LanguageTabs({
  activeTab,
  onChangeTab,
  onCopyEnglish,
}: LanguageTabsProps) {
  const tabs: { code: LanguageCode; label: string; badge: string }[] = [
    { code: "th", label: "Thai", badge: "TH" },
    { code: "en", label: "English", badge: "EN" },
    { code: "zh", label: "Chinese", badge: "ZH" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8FA] p-1.5 rounded-2xl border border-[#E6E8EC]">
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.code;
          return (
            <button
              key={tab.code}
              type="button"
              onClick={() => onChangeTab(tab.code)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
                isActive
                  ? "bg-white text-[#FF9540] shadow-sm border border-[#E6E8EC]"
                  : "text-[#6B7280] hover:text-[#1B2935] hover:bg-white/60"
              )}
            >
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase",
                  isActive ? "bg-orange-100 text-[#FF9540]" : "bg-slate-200 text-slate-600"
                )}
              >
                {tab.badge}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onCopyEnglish}
        className="px-3 py-1.5 text-xs font-bold text-[#FF9540] hover:text-[#FF8420] hover:bg-orange-50 rounded-xl transition border border-orange-200/60 shrink-0 text-center cursor-pointer"
      >
        Copy EN to all languages
      </button>
    </div>
  );
}
