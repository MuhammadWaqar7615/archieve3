"use client";

import React, { useState } from "react";
import { LanguageCode, NotificationTranslation } from "@/types";
import { Bell, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationPreviewProps {
  translations: Record<LanguageCode, NotificationTranslation>;
  selectedLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  imageUrl?: string;
  actionType?: string;
  listingId?: string;
  appName?: string;
}

export function NotificationPreview({
  translations,
  selectedLang,
  onSelectLang,
  imageUrl,
  actionType,
  listingId,
  appName = "Dealer App",
}: NotificationPreviewProps) {
  const [platform, setPlatform] = useState<"iOS" | "Android">("iOS");

  const currentTranslation = translations[selectedLang] || translations.en;

  const languages: { code: LanguageCode; label: string }[] = [
    { code: "th", label: "TH (Thai)" },
    { code: "en", label: "EN (English)" },
    { code: "zh", label: "ZH (Chinese)" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#FF9540]" />
          <span className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
            Live Device Preview
          </span>
        </div>

        <div className="flex items-center bg-[#F7F8FA] p-0.5 rounded-lg text-[11px] font-semibold border border-[#E6E8EC]">
          <button
            onClick={() => setPlatform("iOS")}
            className={cn(
              "px-2.5 py-1 rounded-md transition cursor-pointer font-bold",
              platform === "iOS" ? "bg-white text-[#1B2935] shadow-2xs" : "text-[#6B7280]"
            )}
          >
            iOS
          </button>
          <button
            onClick={() => setPlatform("Android")}
            className={cn(
              "px-2.5 py-1 rounded-md transition cursor-pointer font-bold",
              platform === "Android" ? "bg-white text-[#1B2935] shadow-2xs" : "text-[#6B7280]"
            )}
          >
            Android
          </button>
        </div>
      </div>

      {/* Language Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelectLang(lang.code)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer",
              selectedLang === lang.code
                ? "bg-[#FF9540] text-white shadow-sm"
                : "bg-[#F7F8FA] text-[#6B7280] hover:bg-slate-200"
            )}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Light Theme Device Frame Simulation */}
      <div className="relative max-w-sm mx-auto bg-slate-100 p-4 rounded-3xl shadow-lg border-4 border-slate-300 text-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 mb-3 font-semibold">
          <span>9:41 AM</span>
          <div className="w-16 h-3 bg-slate-300 rounded-full mx-auto" />
          <span>100%</span>
        </div>

        {/* Light Notification Card */}
        <div
          dir="ltr"
          className="bg-white rounded-2xl p-3.5 border border-[#E6E8EC] shadow-md space-y-2.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
            <div className="flex items-center gap-2">
              <img
                src="/square3.png"
                alt="App Icon"
                className="w-5 h-5 rounded-md object-contain shadow-2xs shrink-0"
              />
              <span className="font-bold text-[#1B2935]">{appName}</span>
              <span className="text-[9px] text-[#6B7280]">• Now</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </div>

          <div className="space-y-1 text-left">
            <h4 className="text-xs font-bold text-[#1B2935] leading-tight">
              {currentTranslation?.title || "Title preview..."}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              {currentTranslation?.message || "Notification message content preview..."}
            </p>
          </div>

          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden aspect-video border border-[#E6E8EC] bg-slate-50">
              <img
                src={imageUrl}
                alt="Notification attachment"
                className="w-full h-full object-cover"
              />
              {listingId && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#1B2935]/80 text-[9px] font-mono text-orange-300 backdrop-blur-xs font-bold">
                  ID #{listingId}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
