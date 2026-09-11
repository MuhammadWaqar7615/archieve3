"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  Settings,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { PORTAL_LANGUAGES, PortalLanguageCode } from "@/i18n/config";

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  userDisplayName?: string;
}

/**
 * Extracts initials from display name.
 * e.g., "BenzRajchakru" => "BR", "Benz Rajchakru" => "BR", "Deon Reeder" => "DR", "Admin" => "AD"
 */
function getUserInitials(name: string): string {
  if (!name) return "AD";
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const capitals = clean.match(/[A-Z]/g);
  if (capitals && capitals.length >= 2) {
    return (capitals[0] + capitals[1]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function TopHeader({ onOpenMobileMenu, userDisplayName = "Administrator" }: TopHeaderProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangObj = PORTAL_LANGUAGES.find((l) => l.code === language) || PORTAL_LANGUAGES[0];
  const isBenz = userDisplayName.toLowerCase().includes("benz");
  const avatarBgClass = isBenz ? "bg-[#0078d6]" : "bg-[#1B2935]";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E6E8EC] px-4 md:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-[#1B2935] hover:bg-slate-100 transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Language Selector & User Profile Avatar */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Compact Language Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-[#E6E8EC] text-xs font-semibold text-[#1B2935] transition cursor-pointer select-none"
          >
            <Globe className="w-3.5 h-3.5 text-[#FF9540]" />
            <span>{currentLangObj.label}</span>
            <ChevronDown className="w-3 h-3 text-[#6B7280]" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-[#E6E8EC] p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-0.5">
              {PORTAL_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code as PortalLanguageCode);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    language === lang.code
                      ? "bg-[#FF9540]/10 text-[#FF9540]"
                      : "text-[#1B2935] hover:bg-slate-100"
                  }`}
                >
                  <span>{lang.label}</span>
                  {language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-[#FF9540]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-xl ${avatarBgClass} text-white font-bold text-xs flex items-center justify-center shadow-xs select-none`}>
              {getUserInitials(userDisplayName)}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E6E8EC] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
              <div className="p-3 border-b border-slate-100">
                <p className="font-bold text-xs text-[#1B2935] truncate">{userDisplayName}</p>
                <p className="text-[10px] text-[#6B7280]">{t("common.staffAccount")}</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#1B2935] hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#6B7280]" />
                <span>{t("nav.profileSettings")}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>{t("nav.logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
