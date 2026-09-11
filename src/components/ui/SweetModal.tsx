"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SweetModalType = "success" | "warning" | "error" | "info";

export interface SweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type?: SweetModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isLoading?: boolean;
}

export function SweetModal({
  isOpen,
  onClose,
  onConfirm,
  type = "success",
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
  isLoading = false,
}: SweetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#E6E8EC] z-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Icon Circle */}
        <div className="flex justify-center pt-2">
          {type === "success" && (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce duration-500 shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
          )}

          {type === "warning" && (
            <div className="w-16 h-16 rounded-full bg-orange-100 text-[#FF9540] flex items-center justify-center animate-pulse shadow-inner ring-8 ring-orange-50">
              <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
            </div>
          )}

          {type === "error" && (
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner ring-8 ring-rose-50">
              <XCircle className="w-10 h-10 stroke-[2.5]" />
            </div>
          )}

          {type === "info" && (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner ring-8 ring-blue-50">
              <Info className="w-10 h-10 stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-lg font-bold text-[#1B2935] leading-tight">
            {title}
          </h3>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-2.5 pt-2">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 bg-[#F7F8FA] hover:bg-slate-200 text-[#1B2935] text-xs font-bold rounded-xl border border-[#E6E8EC] transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }}
            disabled={isLoading}
            className={cn(
              "flex-1 py-2.5 px-4 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2",
              type === "success"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : type === "warning"
                ? "bg-[#FF9540] hover:bg-[#FF8420]"
                : type === "error"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#1B2935] hover:bg-slate-800"
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
