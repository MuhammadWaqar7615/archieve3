"use client";

import React, { useState, useEffect } from "react";
import { UserService } from "@/lib/api/services";
import { ResponsiveDrawer } from "@/components/ui/ResponsiveDrawer";
import { UserItem } from "@/types";
import { formatDateLocal } from "@/lib/utils";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Extracts initials from a user's full name.
 * e.g., "Deon Reeder" => "DR", "Admin" => "AD"
 */
function getUserInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

import { useTranslation } from "@/i18n/useTranslation";

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await UserService.getAll();
        // Sort ascending by User ID (10482, 10483, 10484...)
        const sortedData = [...(data || [])].sort((a, b) => {
          const idA = parseInt(String(a.wpUserId).replace(/\D/g, ""), 10) || 0;
          const idB = parseInt(String(b.wpUserId).replace(/\D/g, ""), 10) || 0;
          return idA - idB;
        });
        setUsers(sortedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.wpUserId.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl w-full" />
        <div className="h-12 bg-slate-200 rounded-2xl w-full" />
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("placeholder.search")}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs outline-none focus:border-[#FF9540]"
          />
        </div>
      </div>

      {/* Clean Simplified Users Table */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E6E8EC] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider bg-[#F7F8FA]">
                <th className="py-3.5 px-4 rounded-l-xl w-24">{t("common.id")}</th>
                <th className="py-3.5 px-4">{t("users.user")}</th>
                <th className="py-3.5 px-4">{t("users.email")}</th>
                <th className="py-3.5 px-4 w-28 text-center rounded-r-xl">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EC] text-xs text-slate-700">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u, index) => {
                  const isActive = u.pushEnabled !== false;
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr key={u.wpUserId} className="hover:bg-slate-50/80 transition duration-150">
                      {/* User ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#6B7280] whitespace-nowrap">
                        {rowNumber}
                      </td>

                      {/* User Avatar with Initials + Full Name */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1B2935] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 select-none">
                            {getUserInitials(u.name)}
                          </div>
                          <span className="font-bold text-[#1B2935] text-xs">
                            {u.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-[#6B7280] font-mono text-xs whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Status: Active / Inactive */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-block ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {isActive ? t("common.publish") : t("common.draft")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    {t("users.noUsers")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E6E8EC] text-xs text-[#6B7280]">
          <span>
            Page <strong className="text-[#1B2935]">{currentPage}</strong> of{" "}
            <strong className="text-[#1B2935]">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[#1B2935] flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> {t("common.previous")}
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[#1B2935] flex items-center gap-1 cursor-pointer"
            >
              {t("common.next")} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Drawer */}
      <ResponsiveDrawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`User Details: ${selectedUser?.name}`}
        subtitle="Account profile information"
      >
        {selectedUser && (
          <div className="space-y-6 text-xs">
            <div className="p-5 rounded-2xl bg-[#F7F8FA] border border-[#E6E8EC] space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1B2935] text-white flex items-center justify-center font-bold text-sm shadow-xs select-none">
                  {getUserInitials(selectedUser.name)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1B2935]">
                    {selectedUser.name}
                  </h3>
                  <span className="font-mono text-xs text-[#6B7280]">
                    #{selectedUser.wpUserId}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E6E8EC] pt-3 space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7280] font-bold">Email Address</span>
                  <span className="font-mono font-medium text-[#1B2935]">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7280] font-bold">Status</span>
                  <span className="font-bold text-emerald-700">
                    {selectedUser.pushEnabled !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7280] font-bold">Platform</span>
                  <span className="font-semibold text-[#1B2935]">
                    {selectedUser.platform}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7280] font-bold">Last Active</span>
                  <span className="font-mono text-[#6B7280]">
                    {formatDateLocal(selectedUser.lastSeen)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ResponsiveDrawer>
    </div>
  );
}
