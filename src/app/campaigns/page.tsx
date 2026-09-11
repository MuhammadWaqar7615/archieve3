"use client";

import React, { useState, useEffect } from "react";
import { CampaignService } from "@/lib/api/services";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Campaign } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Megaphone, Plus, Play, Pause, BarChart2, AlertCircle } from "lucide-react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await CampaignService.getAll();
        setCampaigns(data || []);
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
            Campaign Management
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Orchestrate multi-step push notification marketing campaigns across user groups
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF9540] flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B2935]">No campaigns created yet.</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Campaign persistence endpoints are currently read-only in the server backend release.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">Campaign Name</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Sent</th>
                  <th className="py-3 px-4 text-right">Delivered</th>
                  <th className="py-3 px-4 text-right">Opened</th>
                  <th className="py-3 px-4 text-right">CTR</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {campaigns.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#1B2935] max-w-xs truncate">{cmp.name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{cmp.audience}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={cmp.status} /></td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">{formatNumber(cmp.sent)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600">{formatNumber(cmp.delivered)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-blue-600">{formatNumber(cmp.opened)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#FF9540]">{cmp.ctr}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{cmp.scheduledDate}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">{cmp.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
