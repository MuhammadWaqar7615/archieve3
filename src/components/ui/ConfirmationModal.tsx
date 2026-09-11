"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "primary" | "warning";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "primary",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl border border-[#E6E8EC] shadow-2xl max-w-md w-full p-6 z-10 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
              type === "danger"
                ? "bg-rose-50 text-rose-600"
                : type === "warning"
                ? "bg-amber-50 text-amber-600"
                : "bg-orange-50 text-[#FF9540]"
            )}
          >
            {type === "danger" ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1B2935]">{title}</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer",
              type === "danger"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-[#FF9540] hover:bg-[#FF8420] shadow-orange-500/20"
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
