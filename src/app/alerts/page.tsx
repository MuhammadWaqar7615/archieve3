"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MakeModelService } from "@/lib/api/services";
import { MakeAlert, ModelAlert } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Send, AlertCircle } from "lucide-react";

export default function MakeModelAlertsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"makes" | "models">("makes");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935]">
            Make & Model Targeted Alerts
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage subscriber interest rules when users follow specific car brands or specific model series
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-start gap-3 text-xs text-[#1B2935]">
        <AlertCircle className="w-5 h-5 text-[#FF9540] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Targeted Brand Follow-Alerts vs Global New Arrivals</span>
          <p className="text-[#6B7280] leading-relaxed">
            Make & Model follow alerts are targeted exclusively to users who tapped "Follow Make/Model" inside the mobile app. Global New Arrival notifications do not require brand following and dispatch to all registered devices when a brand new listing is published for the first time.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("makes")}
          className={`px-4 py-2 font-bold text-xs rounded-xl transition cursor-pointer ${
            activeTab === "makes"
              ? "bg-[#FF9540] text-white shadow-sm"
              : "text-[#6B7280] hover:bg-slate-100"
          }`}
        >
          Car Makes ({makes.length})
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`px-4 py-2 font-bold text-xs rounded-xl transition cursor-pointer ${
            activeTab === "models"
              ? "bg-[#FF9540] text-white shadow-sm"
              : "text-[#6B7280] hover:bg-slate-100"
          }`}
        >
          Car Models ({models.length})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl">
                  {activeTab === "makes" ? "Make Name" : "Model Name"}
                </th>
                <th className="py-3 px-4 text-right">App Followers</th>
                <th className="py-3 px-4 text-right">Notifications Sent</th>
                <th className="py-3 px-4">Last Alert</th>
                <th className="py-3 px-4 text-center">Alert Rule Status</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {activeTab === "makes"
                ? makes.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-[#1B2935]">{m.make}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#FF9540]">
                        {formatNumber(m.followers)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        {formatNumber(m.notificationsSent)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{m.lastAlert}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => router.push("/send")}
                          className="px-3 py-1.5 bg-orange-50 text-[#FF9540] hover:bg-orange-100 font-bold text-[11px] rounded-lg transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Targeted Push</span>
                        </button>
                      </td>
                    </tr>
                  ))
                : models.map((md) => (
                    <tr key={md.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-[#1B2935]">
                        {md.make} {md.model}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1B2935]">
                        {formatNumber(md.followers)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        {formatNumber(md.notificationsSent)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{md.lastAlert}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => router.push("/send")}
                          className="px-3 py-1.5 bg-slate-100 text-[#1B2935] hover:bg-slate-200 font-bold text-[11px] rounded-lg transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Targeted Push</span>
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
