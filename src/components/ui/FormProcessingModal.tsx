"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Loader2, PlusCircle, Eye, RefreshCw, X } from "lucide-react";

export type ProcessingModalState = "idle" | "processing" | "success" | "error";

interface FormProcessingModalProps {
  isOpen: boolean;
  state: ProcessingModalState;
  mode: "create" | "edit" | "profile";
  listingId?: string;
  errorMessage?: string;
  onCloseError: () => void;
  onCreateAnother?: () => void;
  onViewListing?: () => void;
  onContinueEditing?: () => void;
}

import { useTranslation } from "@/i18n/useTranslation";

export function FormProcessingModal({
  isOpen,
  state,
  mode,
  listingId,
  errorMessage,
  onCloseError,
  onCreateAnother,
  onViewListing,
  onContinueEditing,
}: FormProcessingModalProps) {
  const { t } = useTranslation();
  if (!isOpen || state === "idle") return null;

  const isProcessing = state === "processing";
  const isSuccess = state === "success";
  const isError = state === "error";

  const processingText =
    mode === "create"
      ? t("modal.creatingListing")
      : mode === "edit"
      ? t("modal.updatingListing")
      : t("modal.updatingProfile");

  const successText =
    mode === "create"
      ? t("modal.listingCreatedSuccess")
      : mode === "edit"
      ? t("modal.listingUpdatedSuccess")
      : t("modal.profileUpdatedSuccess");

  const errorText =
    mode === "create"
      ? t("modal.failedCreateListing")
      : mode === "edit"
      ? t("modal.failedUpdateListing")
      : t("modal.failedUpdateProfile");

  const successSubtitle =
    mode === "profile"
      ? t("modal.profileSavedSubtitle")
      : t("modal.listingPublishedSubtitle");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Click disabled while processing */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={isProcessing ? undefined : isError ? onCloseError : undefined}
      />

      {/* Modal Box */}
      <div className="relative bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-[#E6E8EC] z-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Dismiss X button for error or profile success state */}
        {(isError || (isSuccess && mode === "profile")) && (
          <button
            onClick={isError ? onCloseError : onContinueEditing || onCloseError}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl transition cursor-pointer"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 1. PROCESSING STATE */}
        {isProcessing && (
          <div className="py-4 space-y-5">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 animate-pulse" />
              <Loader2 className="w-12 h-12 text-[#1B2935] animate-spin stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#1B2935]">{processingText}</h3>
              <p className="text-xs text-[#6B7280]">
                {mode === "profile"
                  ? t("modal.pleaseWaitProfile")
                  : t("modal.pleaseWaitServer")}
              </p>
            </div>
          </div>
        )}

        {/* 2. SUCCESS STATE */}
        {isSuccess && (
          <div className="py-2 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce duration-500">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#1B2935]">{successText}</h3>
              {listingId && (
                <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-xs font-mono font-bold text-emerald-800">
                    {t("common.id")}: #{listingId}
                  </span>
                </div>
              )}
              <p className="text-xs text-[#6B7280]">
                {successSubtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {mode === "create" && onCreateAnother && (
                <button
                  type="button"
                  onClick={onCreateAnother}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] hover:bg-slate-100 text-[#1B2935] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t("common.createAnother")}</span>
                </button>
              )}

              {mode === "edit" && onContinueEditing && (
                <button
                  type="button"
                  onClick={onContinueEditing}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] hover:bg-slate-100 text-[#1B2935] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t("common.keepEditing")}</span>
                </button>
              )}

              {mode === "profile" && (
                <button
                  type="button"
                  onClick={onContinueEditing || onCloseError}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t("common.ok")}</span>
                </button>
              )}

              {onViewListing && (
                <button
                  type="button"
                  onClick={onViewListing}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t("common.viewListing")}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. ERROR STATE */}
        {isError && (
          <div className="py-2 space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
              <AlertCircle className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2 px-2">
              <h3 className="text-lg font-bold text-[#1B2935]">{errorText}</h3>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium text-left break-words">
                {errorMessage || "An error occurred while processing the request."}
              </div>
              <p className="text-[11px] text-[#6B7280]">
                {t("modal.inputDataSafe")}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onCloseError}
                className="w-full py-2.5 px-5 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t("common.tryAgain")}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
