"use client";

import React, { useState, useEffect } from "react";
import { NotificationService } from "@/lib/api/services";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ResponsiveDrawer } from "@/components/ui/ResponsiveDrawer";
import { NotificationItem } from "@/types";
import { formatNumber, formatDateLocal } from "@/lib/utils";
import { Search, Filter, Eye, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

import { useTranslation } from "@/i18n/useTranslation";

export default function NotificationsHistoryPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifs, setFilteredNotifs] = useState<NotificationItem[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await NotificationService.getAll();
      // Sort ascending by ID (1, 2, 3, 4...)
      const sortedData = [...(data || [])].sort((a, b) => {
        const idA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
        const idB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
        return idA - idB;
      });
      setNotifications(sortedData);
      setFilteredNotifs(sortedData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load notification history from server REST API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = notifications;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((n) => n.type === typeFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((n) => n.status === statusFilter);
    }
    setFilteredNotifs(result);
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter, notifications]);

  const totalPages = Math.ceil(filteredNotifs.length / pageSize) || 1;
  const paginatedNotifs = filteredNotifs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl w-full" />
        <div className="h-12 bg-slate-200 rounded-2xl w-full" />
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935]">
            Notification History & Logs
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Full audit log of all push notifications dispatched by automated rules or admin staff
          </p>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("placeholder.search")}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] outline-none focus:border-[#FF9540]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#6B7280] hidden sm:block" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] outline-none"
          >
            <option value="all">{t("notif.allTypes")}</option>
            <option value="price_drop">{t("notif.priceDrop")}</option>
            <option value="new_arrival">{t("notif.newArrival")}</option>
            <option value="promotion">{t("notif.promotion")}</option>
            <option value="general_announcement">{t("notif.announcement")}</option>
          </select>
        </div>

        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] outline-none"
          >
            <option value="all">{t("notif.allStatuses")}</option>
            <option value="delivered">{t("notif.delivered")}</option>
            <option value="scheduled">{t("notif.scheduled")}</option>
            <option value="pending">{t("notif.pending")}</option>
            <option value="failed">{t("notif.failed")}</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">{t("common.id")}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t("notif.content")}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t("field.bodyType")}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t("notif.audience")}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t("common.status")}</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">{t("notif.sent")}</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">{t("notif.delivered")}</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">{t("notif.opened")}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t("notif.created")}</th>
                <th className="py-3 px-4 text-right rounded-r-xl whitespace-nowrap">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedNotifs.map((item) => {
                const cleanId = String(item.id).replace(/\D/g, "");
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#FF9540] whitespace-nowrap">{cleanId}</td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt="Attachment"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#FF9540] flex items-center justify-center font-bold text-xs shrink-0">
                            NC
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-[#1B2935] truncate">{item.title}</p>
                          <p className="text-[11px] text-[#6B7280] truncate">{item.message}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-orange-50 text-[#FF9540] font-bold text-[11px] capitalize border border-orange-200/50 whitespace-nowrap inline-block">
                        {item.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">{item.audience}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium whitespace-nowrap">{formatNumber(item.sentCount)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600 whitespace-nowrap">
                      {formatNumber(item.deliveredCount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-blue-600 whitespace-nowrap">
                      {formatNumber(item.openedCount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#6B7280] whitespace-nowrap">
                      {formatDateLocal(item.created)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedNotif(item)}
                        title="View Details"
                        className="p-1.5 text-[#6B7280] hover:text-[#FF9540] hover:bg-orange-50 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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

      <ResponsiveDrawer
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        title={selectedNotif?.id ? `Notification #${String(selectedNotif.id).replace(/\D/g, "")}` : "Notification Detail"}
        subtitle="Detailed breakdown, multi-lingual texts, and delivery performance"
      >
        {selectedNotif && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedNotif.status} />
                <span className="font-mono text-slate-500">OneSignal: {selectedNotif.oneSignalId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase">Created By</span>
                  <p className="font-bold">{selectedNotif.createdBy}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase">{t("notif.targetAudience")}</span>
                  <p className="font-bold">{selectedNotif.audience}</p>
                </div>
              </div>
              {selectedNotif.failureReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Failure Reason: {selectedNotif.failureReason}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1B2935] text-sm">Target Languages Content</h4>
              {Object.entries(selectedNotif.translations).map(([lang, trans]) => (
                <div
                  key={lang}
                  className="p-4 rounded-xl border border-[#E6E8EC] bg-white space-y-1.5"
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
