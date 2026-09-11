"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  FileEdit,
  RotateCcw,
} from "lucide-react";

export type StatusType =
  | "delivered"
  | "pending"
  | "processing"
  | "failed"
  | "skipped"
  | "scheduled"
  | "active"
  | "draft"
  | "completed"
  | "paused"
  | "cancelled"
  | "published"
  | "sent"
  | "trash"
  | "deleted";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

import { useTranslation } from "@/i18n/useTranslation";

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const normStatus = status.toLowerCase() as StatusType;

  const getLocalizedStatusText = (s: string): string => {
    const lower = s.toLowerCase();
    if (lower === "publish") return t("listing.status.publish");
    if (lower === "published" || lower === "active") return t("listing.status.published");
    if (lower === "draft") return t("listing.status.draft");
    if (lower === "trash" || lower === "deleted") return t("common.trash");
    if (lower === "pending") return t("listing.status.pending");
    if (lower === "delivered") return t("notif.delivered");
    if (lower === "scheduled") return t("notif.scheduled");
    if (lower === "failed") return t("notif.failed");
    if (lower === "featured") return t("listing.status.featured");
    if (lower === "unfeatured") return t("listing.status.unfeatured");
    return s;
  };

  switch (normStatus) {
    case "delivered":
    case "completed":
    case "sent":
    case "published":
    case "active":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs",
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="capitalize whitespace-nowrap">{getLocalizedStatusText(status)}</span>
        </span>
      );

    case "pending":
    case "scheduled":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs",
            className
          )}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="capitalize whitespace-nowrap">{getLocalizedStatusText(status)}</span>
        </span>
      );

    case "processing":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-purple-50 text-purple-700 border border-purple-200/60 shadow-2xs animate-pulse",
            className
          )}
        >
          <RotateCcw className="w-3.5 h-3.5 text-purple-600 animate-spin shrink-0" />
          <span className="capitalize whitespace-nowrap">{getLocalizedStatusText(status)}</span>
        </span>
      );

    case "failed":
    case "cancelled":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-rose-50 text-rose-700 border border-rose-200/60 shadow-2xs",
            className
          )}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="capitalize whitespace-nowrap">{getLocalizedStatusText(status)}</span>
        </span>
      );

    case "skipped":
    case "paused":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs",
            className
          )}
        >
          <PauseCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="capitalize whitespace-nowrap">{getLocalizedStatusText(status)}</span>
        </span>
      );

    case "draft":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs",
            className
          )}
        >
          <FileEdit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="capitalize whitespace-nowrap">{getLocalizedStatusText(status)}</span>
        </span>
      );

    case "trash":
    case "deleted":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs",
            className
          )}
        >
          <span className="whitespace-nowrap font-medium">{getLocalizedStatusText(status)}</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 bg-slate-100 text-slate-800 border border-slate-200",
            className
          )}
        >
          <span className="capitalize whitespace-nowrap">{getLocalizedStatusText(status)}</span>
        </span>
      );
  }
}
