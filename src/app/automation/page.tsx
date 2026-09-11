"use client";

import React, { useState, useEffect } from "react";
import { AutomationService } from "@/lib/api/services";
import { AutomationRule } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Zap, List, Info } from "lucide-react";
import Link from "next/link";

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await AutomationService.getRules();
        setRules(data);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935]">
            Automated Notification Trigger Rules
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Background worker queue rules for price drops, first-time vehicle publishing, and brand alert dispatches
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#1B2935] text-white border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-[#FF9540] font-bold">
          <Info className="w-4 h-4" />
          <span>New Arrival Logic Architecture</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          The server backend attaches a first-publish marker flag when a brand-new <code className="bg-slate-800 px-1 py-0.5 rounded text-[#FF9540]">listivo_listing</code> is published for the first time. Edits to existing published listings, price changes, description tweaks, or photo updates do NOT trigger a New Arrival push.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF9540] flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1B2935] text-sm">{rule.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400">Rule ID: {rule.id}</span>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  rule.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {rule.status === "active" ? "Enabled ✓" : "Configurable"}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-[#F7F8FA] p-3 rounded-xl border border-[#E6E8EC]">
                {rule.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#F7F8FA]">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase">Triggered</span>
                  <p className="font-bold text-[#1B2935]">{rule.lastTriggered}</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-50">
                  <span className="text-[10px] text-[#FF9540] font-bold uppercase">Push Sent</span>
                  <p className="font-bold text-[#FF9540]">{formatNumber(rule.notificationsGenerated)}</p>
                </div>
                <div className="p-2 rounded-lg bg-rose-50">
                  <span className="text-[10px] text-rose-700 font-bold uppercase">Failed</span>
                  <p className="font-bold text-rose-600">{rule.failedJobs}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#6B7280] text-[11px]">Automatic Cron Dispatch</span>
                <Link
                  href="/logs"
                  className="font-bold text-[#FF9540] hover:text-[#FF8420] transition flex items-center gap-1"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>View Delivery Logs</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
