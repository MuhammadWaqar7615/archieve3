"use client";

import React, { useState, useEffect } from "react";
import { MakeModelService } from "@/lib/api/services";
import { MakeAlert, ModelAlert } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Users, Smartphone, Globe, Tag, Send } from "lucide-react";
import Link from "next/link";

export default function AudiencePage() {
  const [makes, setMakes] = useState<MakeAlert[]>([]);
  const [models, setModels] = useState<ModelAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mks, mds] = await Promise.all([
          MakeModelService.getMakes(),
          MakeModelService.getModels(),
        ]);
        setMakes(mks);
        setModels(mds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="h-96 bg-slate-200 animate-pulse rounded-2xl" />;
  }

  const overviewCards = [
    { title: "All Registered Users", count: 14210, icon: Users, bg: "bg-orange-50", text: "text-[#FF9540]" },
    { title: "Registered Devices", count: 9482, icon: Smartphone, bg: "bg-slate-100", text: "text-[#1B2935]" },
    { title: "Android Devices", count: 5210, icon: Smartphone, bg: "bg-emerald-50", text: "text-emerald-600" },
    { title: "iOS Devices", count: 4272, icon: Smartphone, bg: "bg-blue-50", text: "text-blue-600" },
    { title: "Thai Users (TH)", count: 7120, icon: Globe, bg: "bg-amber-50", text: "text-amber-600" },
    { title: "English Users (EN)", count: 1420, icon: Globe, bg: "bg-cyan-50", text: "text-cyan-600" },
    { title: "Chinese Users (ZH)", count: 680, icon: Globe, bg: "bg-rose-50", text: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935]">
            Audience Overview & Segmentation
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Monitor target audience clusters, platform demographics, and vehicle brand followers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="p-4 bg-white rounded-2xl border border-[#E6E8EC] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase">{card.title}</span>
                <div className="text-xl font-bold text-[#1B2935]">{formatNumber(card.count)}</div>
              </div>
              <div className={`p-3 rounded-xl ${card.bg} ${card.text}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1B2935]">Top Make Followers</h2>
            <Tag className="w-4 h-4 text-[#FF9540]" />
          </div>
          <div className="space-y-2.5">
            {makes.map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1B2935] text-xs">{m.make}</h4>
                  <span className="text-[11px] text-[#6B7280]">{m.notificationsSent} targeted alerts sent</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-orange-100 text-[#FF9540] font-bold text-xs">
                    {formatNumber(m.followers)} followers
                  </span>
                  <Link href="/send" className="p-1 text-slate-400 hover:text-[#FF9540]">
                    <Send className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1B2935]">Top Model Followers</h2>
            <Tag className="w-4 h-4 text-[#1B2935]" />
          </div>
          <div className="space-y-2.5">
            {models.map((md) => (
              <div key={md.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1B2935] text-xs">{md.make} {md.model}</h4>
                  <span className="text-[11px] text-[#6B7280]">{md.notificationsSent} targeted alerts sent</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-slate-200 text-[#1B2935] font-bold text-xs">
                    {formatNumber(md.followers)} followers
                  </span>
                  <Link href="/send" className="p-1 text-slate-400 hover:text-[#1B2935]">
                    <Send className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
