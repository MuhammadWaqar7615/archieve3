"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ResponsiveDrawer } from "@/components/ui/ResponsiveDrawer";
import { NotificationService } from "@/lib/api/services";
import { DashboardStats, NotificationItem } from "@/types";
import { formatNumber, formatDateLocal } from "@/lib/utils";
import {
  Send,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Clock,
  Smartphone,
  Users,
  Car,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ShieldCheck,
  Bell,
} from "lucide-react";

export default function NotificationStatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [audience, setAudience] = useState<any>(null);
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [statsData, notifData, audienceData] = await Promise.all([
        NotificationService.getStats(),
        NotificationService.getAll(),
        fetch("/api/dealer/audience").then(res => res.json()).catch(() => ({})),
      ]);

      // Sort notifications in ascending order by ID (1, 2, 3, 4...)
      const sortedNotifs = [...(notifData || [])].sort((a, b) => {
        const idA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
        const idB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
        return idA - idB;
      });

      setStats(statsData);
      setAudience(audienceData);
      setRecentNotifs(sortedNotifs);
    } catch (err: any) {
      console.error("Failed to load notification stats data:", err);
      setErrorMsg(err.message || "Failed to load notification statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPages = Math.ceil(recentNotifs.length / pageSize) || 1;
  const paginatedNotifs = recentNotifs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 sm:h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#FF9540]" />
            <span>Notification Statistics</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Push delivery metrics, performance indicators, and recent notification dispatches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/send"
            className="px-4 py-2 bg-[#FF9540] hover:bg-[#FF8420] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Notification</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Request</span>
          </button>
        </div>
      )}

      {/* 8 KPI STAT CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Sent"
            value={stats.totalSent}
            icon={Send}
            trend={stats.sentTrend}
            iconBgColor="bg-orange-50"
            iconTextColor="text-[#FF9540]"
          />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle2}
            trend={stats.deliveredTrend}
            iconBgColor="bg-emerald-50"
            iconTextColor="text-emerald-600"
          />
          <StatCard
            title="Opened"
            value={stats.opened}
            icon={Eye}
            trend={stats.openedTrend}
            iconBgColor="bg-blue-50"
            iconTextColor="text-blue-600"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={AlertTriangle}
            trend={stats.failedTrend}
            iconBgColor="bg-rose-50"
            iconTextColor="text-rose-600"
          />
          <StatCard
            title="Pending Queue"
            value={stats.pendingQueue}
            icon={Clock}
            trend={(stats as any).pendingQueueTrend}
            iconBgColor="bg-amber-50"
            iconTextColor="text-amber-600"
          />
          <StatCard
            title="Registered Devices"
            value={audience?.registeredDevices ?? 0}
            icon={Smartphone}
            trend={(stats as any).registeredDevicesTrend}
            iconBgColor="bg-indigo-50"
            iconTextColor="text-indigo-600"
          />
          <StatCard
            title="Active Users"
            value={(stats as any).activeUsers}
            icon={Users}
            trend={(stats as any).activeUsersTrend}
            iconBgColor="bg-cyan-50"
            iconTextColor="text-cyan-600"
          />
          <StatCard
            title="New Arrivals Sent"
            value={(stats as any).newArrivalsSent}
            icon={Car}
            trend={(stats as any).newArrivalsSentTrend}
            iconBgColor="bg-orange-50"
            iconTextColor="text-[#FF9540]"
          />
        </div>
      )}

      {/* NOTIFICATION ACTIVITY CHART */}
      {stats && (
        <PerformanceChart
          deliveryRate={stats.deliveryRate}
          openRate={stats.openRate}
          failureRate={stats.failureRate}
        />
      )}

      {/* SYSTEM STATUS CARD */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
              System Status
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            Server API Health: Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center justify-between">
            <span className="font-bold text-[#1B2935]">Push Notifications</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Operational ✓
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center justify-between">
            <span className="font-bold text-[#1B2935]">Notification Queue</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Operational ✓
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center justify-between">
            <span className="font-bold text-[#1B2935]">Scheduled Processing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Operational ✓
            </span>
          </div>
        </div>
      </div>

      {/* RECENT NOTIFICATIONS TABLE WITH PAGINATION */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1B2935]">
              Recent Notifications
            </h2>
            <p className="text-xs text-[#6B7280]">
              Latest push notification dispatches sorted in ascending order (1, 2, 3, 4...)
            </p>
          </div>
          <Link
            href="/notifications"
            className="flex items-center gap-1 text-xs font-bold text-[#FF9540] hover:text-[#FF8420] transition"
          >
            <span>Notification History</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">Notification</th>
                <th className="py-3 px-4 whitespace-nowrap">Audience</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 rounded-r-xl whitespace-nowrap">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedNotifs.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedNotif(item)}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-medium text-slate-900 max-w-sm">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt="Thumb"
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-orange-50 text-[#FF9540] flex items-center justify-center font-bold text-xs shrink-0">
                          NC
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-[#1B2935] truncate">
                          #{String(item.id).replace(/\D/g, "")} {item.title}
                        </p>
                        <p className="text-[11px] text-[#6B7280] truncate">{item.message}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                    {item.audience}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3.5 px-4 text-[#6B7280] font-mono text-[11px] whitespace-nowrap">
                    {formatDateLocal(item.created)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-[#6B7280]">
          <span>
            Page <strong className="text-[#1B2935]">{currentPage}</strong> of <strong className="text-[#1B2935]">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[#1B2935] flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[#1B2935] flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <ResponsiveDrawer
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        title={selectedNotif?.id ? `Notification #${selectedNotif.id}` : "Notification Detail"}
        subtitle="Full multi-language translations and action payload stats"
      >
        {selectedNotif && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedNotif.status} />
                <span className="font-mono text-[#6B7280]">OneSignal: {selectedNotif.oneSignalId}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#6B7280]">Created By</span>
                <p className="font-bold text-[#1B2935]">{selectedNotif.createdBy} at {formatDateLocal(selectedNotif.created)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1B2935] text-sm">Multi-Language Content</h4>
              {Object.entries(selectedNotif.translations).map(([lang, trans]) => (
                <div
                  key={lang}
                  className="p-3.5 rounded-xl border border-[#E6E8EC] bg-white space-y-1"
                >
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#FF9540] font-bold text-[10px] uppercase">
                    {lang}
                  </span>
                  <p className="font-bold text-[#1B2935] text-xs mt-1">{trans.title}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{trans.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </ResponsiveDrawer>
    </div>
  );
}
