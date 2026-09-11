"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { ListingService, VehicleService } from "@/lib/api/services";
import { ListingStats, Vehicle } from "@/types";
import { SweetModal, SweetModalType } from "@/components/ui/SweetModal";
import {
  Car,
  CheckCircle2,
  Star,
  FileText,
  Clock,
  Trash2,
  Calendar,
  CalendarDays,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit3,
  Loader2,
  MoreVertical,
} from "lucide-react";

import { useTranslation } from "@/i18n/useTranslation";
import { useTenantPath } from "@/lib/useTenantPath";

export default function ListingDashboardPage() {
  const { t, listivoLanguage } = useTranslation();
  const getPath = useTenantPath();
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [processingFeaturedId, setProcessingFeaturedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [userName, setUserName] = useState<string>("Administrator");

  // SweetModal State
  const [sweetModal, setSweetModal] = useState<{
    isOpen: boolean;
    type: SweetModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const loadDashboardData = async (currentLang: string = listivoLanguage) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [statsData, vehiclesResponse] = await Promise.all([
        ListingService.getStats(),
        VehicleService.getAll(undefined, 1, 5, undefined, currentLang).catch(() => ({ vehicles: [] })),
      ]);

      setStats(statsData);
      setRecentVehicles((vehiclesResponse.vehicles || []).slice(0, 5));
    } catch (err: any) {
      console.error("Failed to load listing dashboard statistics:", err);
      setErrorMsg(err.message || "Failed to load listing statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(listivoLanguage);
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && (data.user?.displayName || data.user?.username)) {
          setUserName(data.user.displayName || data.user.username);
        }
      })
      .catch(() => {});
  }, [listivoLanguage]);

  useEffect(() => {
    const handleGlobalClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleToggleFeatured = async (car: Vehicle) => {
    const isCurrentlyFeatured = Boolean(car.featured);
    const newFeaturedVal = isCurrentlyFeatured ? "0" : "1";

    setProcessingFeaturedId(car.listingId);
    try {
      const res = await ListingService.updateListing(car.listingId, {
        featured: newFeaturedVal,
      });

      if (res && (res.success === false || (res as any).error)) {
        throw new Error((res as any).error || res.message || "Server update failed.");
      }

      setRecentVehicles((prev) =>
        prev.map((item) =>
          item.listingId === car.listingId
            ? { ...item, featured: newFeaturedVal === "1" }
            : item
        )
      );

      await loadDashboardData();
    } catch (err: any) {
      console.error("Failed to update featured status:", err);
      setSweetModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: err?.message || "Failed to update featured status.",
      });
    } finally {
      setProcessingFeaturedId(null);
    }
  };

  const handleTrashListing = (car: Vehicle) => {
    setSweetModal({
      isOpen: true,
      type: "warning",
      title: "Move Listing to Trash?",
      message: `Are you sure you want to move Listing #${car.listingId} (${car.title}) to trash? It can be restored later if needed.`,
      onConfirm: async () => {
        try {
          await ListingService.trashListing(car.listingId);
          setRecentVehicles((prev) => prev.filter((item) => item.listingId !== car.listingId));
          setSweetModal({
            isOpen: true,
            type: "success",
            title: "Listing Trashed",
            message: `Listing #${car.listingId} was successfully moved to trash.`,
          });
          await loadDashboardData();
        } catch (err: any) {
          console.error("Failed to trash listing:", err);
          setSweetModal({
            isOpen: true,
            type: "error",
            title: "Trash Failed",
            message: err?.message || "Failed to move listing to trash.",
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DYNAMIC WELCOME BACK HEADER */}
      <div className="bg-white p-5 rounded-xl border border-[#E6E8EC]">
        <h1 className="text-xl font-bold text-[#1B2935]">
          {t("nav.welcomeBack", { name: userName })}
        </h1>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => loadDashboardData(listivoLanguage)}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 8 MINIMAL MONOCHROME STAT CARDS */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title={t("dashboard.stats.total")}
            value={stats.total}
            icon={Car}
          />
          <StatCard
            title={t("dashboard.stats.published")}
            value={stats.published}
            icon={CheckCircle2}
          />
          <StatCard
            title={t("dashboard.stats.featured")}
            value={stats.featured}
            icon={Star}
          />
          <StatCard
            title={t("dashboard.stats.pending")}
            value={stats.pending}
            icon={Clock}
          />
          <StatCard
            title={t("common.trash")}
            value={stats.trash}
            icon={Trash2}
          />
          <StatCard
            title="Last 7 Days"
            value={stats.last7Days}
            icon={Calendar}
          />
          <StatCard
            title="Last 30 Days"
            value={stats.last30Days}
            icon={CalendarDays}
          />
        </div>
      )}

      {/* RECENT LISTINGS - EXACT SMALLER VERSION OF ALL LISTINGS TABLE */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E6E8EC] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1B2935]">{t("dashboard.recentlyPublished")}</h2>
            <p className="text-xs text-[#6B7280]">{t("dashboard.recentlyPublished")}</p>
          </div>
          <Link
            href={getPath("/vehicles")}
            className="flex items-center gap-1 text-xs font-bold text-[#FF9540] hover:text-[#FF8420] transition"
          >
            <span>{t("dashboard.viewAll")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E6E8EC] text-[#6B7280] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-20">{t("common.id")}</th>
                <th className="py-3.5 px-4 w-16 text-center">{t("common.thumb")}</th>
                <th className="py-3.5 px-4">{t("common.title")}</th>
                <th className="py-3.5 px-4 w-28">{t("common.price")}</th>
                <th className="py-3.5 px-4 w-28">{t("common.mileage")}</th>
                <th className="py-3.5 px-4 w-20">{t("common.views")}</th>
                <th className="py-3.5 px-4 w-24">{t("common.status")}</th>
                <th className="py-3.5 px-4 w-32">{t("common.featured")}</th>
                <th className="py-3.5 px-4 text-right w-24">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EC]">
              {recentVehicles.length > 0 ? (
                recentVehicles.map((car) => {
                  const isFeatured = car.featured;
                  const isFeaturedLoading = processingFeaturedId === car.listingId;

                  return (
                    <tr
                      key={car.listingId}
                      className="hover:bg-slate-50/80 transition duration-150"
                    >
                      {/* ID */}
                      <td className="py-3 px-4 align-middle font-mono font-bold text-[#6B7280]">
                        #{car.listingId}
                      </td>

                      {/* Thumbnail */}
                      <td className="py-3 px-4 text-center align-middle">
                        <img
                          src={car.imageUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='120' height='90' fill='%23F1F5F9'/><path d='M35 52l9-12 7 9 12-16 17 22H35z' fill='%23CBD5E1'/><circle cx='44' cy='36' r='5' fill='%23CBD5E1'/><text x='60' y='72' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2394A3B8' text-anchor='middle'>NO IMAGE</text></svg>"}
                          alt={car.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='120' height='90' fill='%23F1F5F9'/><path d='M35 52l9-12 7 9 12-16 17 22H35z' fill='%23CBD5E1'/><circle cx='44' cy='36' r='5' fill='%23CBD5E1'/><text x='60' y='72' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2394A3B8' text-anchor='middle'>NO IMAGE</text></svg>";
                          }}
                          className="w-12 h-9 object-cover rounded-lg border border-slate-200 shadow-2xs mx-auto"
                        />
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 align-middle max-w-xs">
                        <Link
                          href={getPath(`/vehicles/${car.listingId}`)}
                          className="font-bold text-[#1B2935] hover:text-[#FF9540] transition line-clamp-2 leading-snug"
                          title={car.title}
                        >
                          {car.title}
                        </Link>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 align-middle font-bold text-[#FF9540] whitespace-nowrap">
                        {car.formattedPrice}
                      </td>

                      {/* Mileage */}
                      <td className="py-3 px-4 align-middle font-medium text-[#1B2935] whitespace-nowrap">
                        {car.mileage !== undefined && car.mileage !== ""
                          ? `${Number(car.mileage).toLocaleString()} km`
                          : "—"}
                      </td>

                      {/* Views */}
                      <td className="py-3 px-4 align-middle font-medium text-[#1B2935] whitespace-nowrap">
                        {car.views !== null && car.views !== undefined ? car.views.toLocaleString("en-US") : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          {car.status?.toLowerCase() === "publish" || car.status?.toLowerCase() === "published"
                            ? t("listing.status.published")
                            : car.status?.toLowerCase() === "draft"
                            ? t("listing.status.draft")
                            : car.status?.toLowerCase() === "pending"
                            ? t("listing.status.pending")
                            : car.status}
                        </span>
                      </td>

                      {/* Featured Toggle Switch */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isFeaturedLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFeatured(car);
                            }}
                            className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 ease-in-out cursor-pointer ${
                              isFeatured ? "bg-[#FF9540]" : "bg-slate-300"
                            }`}
                            title={isFeatured ? t("listing.status.removeFeatured") : t("listing.status.markAsFeatured")}
                          >
                            <span
                              style={{ transform: isFeatured ? "translateX(16px)" : "translateX(2px)" }}
                              className="inline-block w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm"
                            />
                          </button>
                          {isFeaturedLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF9540]" />
                          ) : isFeatured ? (
                            <span className="text-[11px] font-bold text-[#FF9540]">{t("listing.status.featured")}</span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">{t("listing.status.unfeatured")}</span>
                          )}
                        </div>
                      </td>

                      {/* Actions (Three Dots Menu) */}
                      <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId((prev) => (prev === car.listingId ? null : car.listingId));
                            }}
                            className="p-1.5 rounded-lg border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            title="Actions Menu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === car.listingId && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-[#E6E8EC] shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100 text-left"
                            >
                              <Link
                                href={getPath(`/vehicles/${car.listingId}`)}
                                onClick={() => setOpenMenuId(null)}
                                className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-[#1B2935] font-semibold transition"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Details</span>
                              </Link>
                              <Link
                                href={getPath(`/listings/${car.listingId}/edit`)}
                                onClick={() => setOpenMenuId(null)}
                                className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-[#1B2935] font-semibold transition"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit Listing</span>
                              </Link>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleTrashListing(car);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 text-rose-600 font-semibold transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Move to Trash</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No recent listings available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SweetModal Popup */}
      <SweetModal
        isOpen={sweetModal.isOpen}
        onClose={() => setSweetModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={sweetModal.onConfirm}
        type={sweetModal.type}
        title={sweetModal.title}
        message={sweetModal.message}
        showCancel={true}
        confirmText="Proceed"
      />
    </div>
  );
}
