"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { NotificationPreview } from "@/components/ui/NotificationPreview";
import { SweetModal, SweetModalType } from "@/components/ui/SweetModal";
import {
  NotificationService,
  VehicleService,
  UserService,
  MakeModelService,
  AudienceService,
} from "@/lib/api/services";
import {
  LanguageCode,
  NotificationType,
  AudienceType,
  ActionType,
  NotificationTranslation,
  Vehicle,
  UserItem,
  MakeAlert,
  ModelAlert,
} from "@/types";
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  X,
  Plus,
  Car,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// HTML entity decoder to prevent 4&#215;4 issues
function decodeEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#215;/g, "×")
    .replace(/&times;/g, "×")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

type TermLike = {
  id?: string | number;
  term_id?: string | number;
  termId?: string | number;
  name?: string;
  term_name?: string;
  make?: string;
  model?: string;
};

// Helper to extract numeric or string term ID from a make/model API object
function getTermId(item?: TermLike | null): string {
  if (!item) return "";
  const value = item.term_id ?? item.termId ?? item.id;
  return value !== undefined && value !== null ? String(value) : "";
}

// Helper to extract display name from a make API object
function getMakeName(item?: TermLike | null): string {
  if (!item) return "";
  const name = item.make ?? item.name ?? item.term_name;
  return name ? String(name) : "";
}

// Helper to extract display name from a model API object
function getModelName(item?: TermLike | null): string {
  if (!item) return "";
  const name = item.model ?? item.name ?? item.term_name;
  return name ? String(name) : "";
}

export default function SendNotificationPage() {
  // --- 1. AUDIENCE STATE ---
  const [audienceType, setAudienceType] = useState<AudienceType>("all");

  // Specific Users targeting
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Language targeting
  const [audienceLanguages, setAudienceLanguages] = useState<LanguageCode[]>(["en", "th"]);

  // Make & Model targeting
  const [makesList, setMakesList] = useState<MakeAlert[]>([]);
  const [modelsList, setModelsList] = useState<ModelAlert[]>([]);
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedMakeName, setSelectedMakeName] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedModelName, setSelectedModelName] = useState("");
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Real Audience Estimate Count
  const [estimatedRecipients, setEstimatedRecipients] = useState<number | null>(null);

  // --- 2. NOTIFICATION TYPE STATE ---
  const [type, setType] = useState<NotificationType>("general_announcement");

  // Vehicle selector for Vehicle Notification Type
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [vehicleSearchResults, setVehicleSearchResults] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // --- 3. MULTI-LANGUAGE CONTENT STATE ---
  const [enabledLanguages, setEnabledLanguages] = useState<LanguageCode[]>(["en", "th"]);
  const [activeLangTab, setActiveLangTab] = useState<LanguageCode>("en");

  const [translations, setTranslations] = useState<Record<LanguageCode, NotificationTranslation>>({
    en: { title: "", message: "" },
    th: { title: "", message: "" },
    zh: { title: "", message: "" },
  });

  // --- 4. ACTION / DESTINATION STATE ("ON TAP") ---
  const [actionType, setActionType] = useState<ActionType>("inbox");
  const [externalUrl, setExternalUrl] = useState("");
  const [actionManuallyChanged, setActionManuallyChanged] = useState(false);

  // --- 5. IMAGE STATE ---
  const [imageOption, setImageOption] = useState<"none" | "vehicle" | "custom">("none");
  const [customImageUrl, setCustomImageUrl] = useState("");

  // --- 6. DELIVERY TIMING STATE ---
  const [deliveryOption, setDeliveryOption] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // --- 7. SWEETMODAL POPUP STATE ---
  const [sweetModal, setSweetModal] = useState<{
    isOpen: boolean;
    type: SweetModalType;
    title: string;
    message: string;
    showCancel?: boolean;
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successQueue, setSuccessQueue] = useState<{
    message: string;
    queueId?: string | number;
  } | null>(null);

  // =========================================================================
  // API DATA FETCHING
  // =========================================================================

  // Load makes when Make/Model audience is chosen
  useEffect(() => {
    if (audienceType === "make_followers" || audienceType === "model_followers") {
      async function loadMakes() {
        setLoadingMakes(true);
        try {
          const res = await MakeModelService.getMakes();
          setMakesList(res || []);
        } catch (err) {
          console.error("Failed to load vehicle makes:", err);
        } finally {
          setLoadingMakes(false);
        }
      }
      loadMakes();
    }
  }, [audienceType]);

  // Load models when make is selected for Model Followers
  useEffect(() => {
    if (audienceType === "model_followers" && (selectedMakeId || selectedMakeName)) {
      async function loadModels() {
        setLoadingModels(true);
        try {
          const queryArg = selectedMakeName || selectedMakeId;
          const res = await MakeModelService.getModels(queryArg);
          setModelsList(res || []);
        } catch (err) {
          console.error("Failed to load models:", err);
          setModelsList([]);
        } finally {
          setLoadingModels(false);
        }
      }
      loadModels();
    } else {
      setModelsList([]);
    }
  }, [audienceType, selectedMakeId, selectedMakeName]);

  // Debounced User Search
  useEffect(() => {
    if (audienceType !== "specific_users") return;
    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const res = await UserService.getAll(userSearchQuery);
        setUserSearchResults(res || []);
      } catch (err) {
        console.error("Failed to search users:", err);
        setUserSearchResults([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, audienceType]);

  // Debounced Vehicle Search
  useEffect(() => {
    if (actionType !== "vehicle") return;
    const timer = setTimeout(async () => {
      setLoadingVehicles(true);
      try {
        const res = await VehicleService.getAll(vehicleSearchQuery);
        setVehicleSearchResults(res?.vehicles || []);
      } catch (err) {
        console.error("Failed to search vehicles:", err);
        setVehicleSearchResults([]);
      } finally {
        setLoadingVehicles(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [vehicleSearchQuery, type, actionType]);

  // Fetch real audience estimate if available
  useEffect(() => {
    async function checkEstimate() {
      try {
        const params: Record<string, string> = { audienceType };
        if (selectedMakeId) params.makeId = selectedMakeId;
        if (selectedMakeName) params.make = selectedMakeName;
        if (selectedModelId) params.modelId = selectedModelId;
        if (selectedModelName) params.model = selectedModelName;

        const res = await AudienceService.getEstimate(params);
        if (res && typeof res.estimatedRecipients === "number") {
          setEstimatedRecipients(res.estimatedRecipients);
        } else if (res && typeof res.count === "number") {
          setEstimatedRecipients(res.count);
        } else {
          setEstimatedRecipients(null);
        }
      } catch {
        setEstimatedRecipients(null);
      }
    }
    checkEstimate();
  }, [audienceType, selectedMakeId, selectedMakeName, selectedModelId, selectedModelName]);

  // Reset selected model when make changes
  const handleMakeSelect = (makeIdVal: string) => {
    const found = makesList.find((m) => getTermId(m) === makeIdVal || getMakeName(m) === makeIdVal);
    const termId = found ? getTermId(found) : makeIdVal;
    const name = found ? getMakeName(found) : makeIdVal;
    setSelectedMakeId(termId);
    setSelectedMakeName(name);
    // Clear selected model and models list when make changes
    setSelectedModelId("");
    setSelectedModelName("");
    setModelsList([]);
  };

  // Handle model selection
  const handleModelSelect = (modelIdVal: string) => {
    const found = modelsList.find((m) => getTermId(m) === modelIdVal || getModelName(m) === modelIdVal);
    const termId = found ? getTermId(found) : modelIdVal;
    const name = found ? getModelName(found) : modelIdVal;
    setSelectedModelId(termId);
    setSelectedModelName(name);
  };

  // Auto-assist on vehicle selection
  const handleSelectVehicle = (car: Vehicle) => {
    setSelectedVehicle(car);
    if (!actionManuallyChanged) {
      setActionType("vehicle");
    }
    if (car.imageUrl) {
      setImageOption("vehicle");
    }
  };

  // Handle language enable / disable
  const handleToggleEnableLanguage = (lang: LanguageCode) => {
    if (enabledLanguages.includes(lang)) {
      if (enabledLanguages.length > 1) {
        const next = enabledLanguages.filter((l) => l !== lang);
        setEnabledLanguages(next);
        if (activeLangTab === lang) {
          setActiveLangTab(next[0]);
        }
      }
    } else {
      setEnabledLanguages([...enabledLanguages, lang]);
      setActiveLangTab(lang);
    }
  };

  // Content field change handler with entity decoding
  const handleTranslationChange = (field: "title" | "message", val: string) => {
    const cleanVal = decodeEntities(val);
    setTranslations((prev) => ({
      ...prev,
      [activeLangTab]: {
        ...prev[activeLangTab],
        [field]: cleanVal,
      },
    }));
  };

  // Effective Image URL for preview and payload
  const effectiveImageUrl = useMemo(() => {
    if (imageOption === "none") return undefined;
    if (imageOption === "vehicle" && selectedVehicle) return selectedVehicle.imageUrl;
    if (imageOption === "custom" && customImageUrl.trim()) return customImageUrl.trim();
    return undefined;
  }, [imageOption, selectedVehicle, customImageUrl]);

  // Validation Logic
  const validationError = useMemo(() => {
    // 1. Audience validation
    if (audienceType === "specific_users" && selectedUsers.length === 0) {
      return "Please select at least one specific user.";
    }
    if (audienceType === "users_by_language" && audienceLanguages.length === 0) {
      return "Please select at least one target language.";
    }
    if (audienceType === "make_followers") {
      const makeIdNum = Number(selectedMakeId);
      if (!selectedMakeId || isNaN(makeIdNum) || makeIdNum <= 0) {
        return "Please select a valid make.";
      }
    }
    if (audienceType === "model_followers") {
      const makeIdNum = Number(selectedMakeId);
      const modelIdNum = Number(selectedModelId);
      if (!selectedMakeId || isNaN(makeIdNum) || makeIdNum <= 0) {
        return "Please select a valid make.";
      }
      if (!selectedModelId || isNaN(modelIdNum) || modelIdNum <= 0) {
        return "Please select a valid model.";
      }
    }

    // 2. Content validation (Check all enabled languages)
    for (const lang of enabledLanguages) {
      const trans = translations[lang];
      if (!trans || !trans.title.trim()) {
        return `Notification title is required for ${lang.toUpperCase()}.`;
      }
      if (!trans || !trans.message.trim()) {
        return `Notification message body is required for ${lang.toUpperCase()}.`;
      }
    }

    // 3. Action validation
    if (actionType === "vehicle" && !selectedVehicle) {
      return "Please select a target vehicle listing.";
    }
    if (actionType === "external_url") {
      if (!externalUrl.trim()) return "External URL is required.";
      if (!/^https?:\/\//i.test(externalUrl.trim())) {
        return "External URL must start with http:// or https://";
      }
    }

    // 4. Custom image URL validation
    if (imageOption === "custom" && customImageUrl.trim()) {
      if (!/^https?:\/\//i.test(customImageUrl.trim())) {
        return "Custom Image URL must start with http:// or https://";
      }
    }

    // 5. Scheduling validation
    if (deliveryOption === "schedule") {
      if (!scheduledDate || !scheduledTime) {
        return "Please specify both a date and time for scheduled delivery.";
      }
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (isNaN(scheduledDateTime.getTime())) {
        return "Invalid date/time format for scheduled delivery.";
      }
      if (scheduledDateTime <= new Date()) {
        return "Scheduled delivery time must be in the future.";
      }
    }

    return null;
  }, [
    audienceType,
    selectedUsers,
    audienceLanguages,
    selectedMakeId,
    selectedModelId,
    enabledLanguages,
    translations,
    actionType,
    selectedVehicle,
    externalUrl,
    imageOption,
    customImageUrl,
    deliveryOption,
    scheduledDate,
    scheduledTime,
  ]);

  // Construct Audience Label for API Payload & Confirmation Modal
  const audienceLabelSummary = useMemo(() => {
    switch (audienceType) {
      case "all":
        return "All Users";
      case "specific_users":
        return `Specific Users (${selectedUsers.length} selected)`;
      case "users_by_language":
        return `Users by Language (${audienceLanguages.map((l) => l.toUpperCase()).join(", ")})`;
      case "make_followers":
        return `Make Followers · ${selectedMakeName || "Not Selected"}`;
      case "model_followers":
        return `Model Followers · ${selectedMakeName && selectedModelName ? `${selectedMakeName} ${selectedModelName}` : "Not Selected"}`;
      default:
        return "All Users";
    }
  }, [audienceType, selectedUsers, audienceLanguages, selectedMakeName, selectedModelName]);

  // Trigger Confirmation Popup Modal
  const handleOpenConfirmPopup = () => {
    if (validationError) return;
    setSweetModal({
      isOpen: true,
      type: "warning",
      title: "Send Notification?",
      message: `Are you sure you want to send this push notification for ${audienceLabelSummary}?`,
      showCancel: true,
      confirmText: "Send Notification",
      onConfirm: handleSubmitFinal,
    });
  };

  // Submit Final Payload
  const handleSubmitFinal = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    // Build clean multi-language translations payload
    const finalTranslations: Record<string, NotificationTranslation> = {};
    for (const lang of enabledLanguages) {
      finalTranslations[lang] = {
        title: translations[lang].title.trim(),
        message: translations[lang].message.trim(),
      };
    }

    // Build Action Payload
    let actionPayload: Record<string, any> = {};
    if (actionType === "vehicle" && selectedVehicle) {
      actionPayload = { listingId: selectedVehicle.listingId };
    } else if (actionType === "external_url") {
      actionPayload = { url: externalUrl.trim() };
    }

    const payload: Record<string, any> = {
      type,
      audience: audienceLabelSummary,
      audienceType,
      targetLanguages: enabledLanguages,
      translations: finalTranslations,
      actionType,
      actionPayload,
      imageUrl: effectiveImageUrl || null,
      scheduledAt:
        deliveryOption === "schedule" ? `${scheduledDate} ${scheduledTime}` : null,
    };

    if (audienceType === "specific_users") {
      payload.targetUserIds = selectedUsers.map((u) => u.wpUserId);
    } else if (audienceType === "make_followers") {
      const makeIdNum = Number(selectedMakeId);
      if (!isNaN(makeIdNum) && makeIdNum > 0) {
        payload.makeIds = [makeIdNum];
      }
      if (selectedMakeName) {
        payload.targetMake = selectedMakeName;
      }
    } else if (audienceType === "model_followers") {
      const modelIdNum = Number(selectedModelId);
      payload.modelIds = [modelIdNum];
      if (selectedMakeId) {
        const makeIdNum = Number(selectedMakeId);
        if (!isNaN(makeIdNum) && makeIdNum > 0) {
          payload.makeIds = [makeIdNum];
        }
      }
      if (selectedMakeName) {
        payload.targetMake = selectedMakeName;
      }
      if (selectedModelName) {
        payload.targetModel = selectedModelName;
      }
    }

    try {
      const res = await NotificationService.send(payload);
      if (res && res.success !== false) {
        const isScheduled = deliveryOption === "schedule";
        const qId = res.queueId || res.id || "101";

        setSuccessQueue({
          message: isScheduled
            ? "Notification scheduled successfully."
            : "Notification queued successfully.",
          queueId: qId,
        });

        // Trigger Success Popup Modal
        setSweetModal({
          isOpen: true,
          type: "success",
          title: isScheduled ? "Notification Scheduled!" : "Notification Queued!",
          message: `Push notification #${qId} has been queued successfully for ${audienceLabelSummary}.`,
          showCancel: false,
          confirmText: "Great!",
        });

        // Reset Form Content after success
        setTranslations({
          en: { title: "", message: "" },
          th: { title: "", message: "" },
          zh: { title: "", message: "" },
        });
        setSelectedVehicle(null);
        setSelectedUsers([]);
        setSelectedMakeId("");
        setSelectedMakeName("");
        setSelectedModelId("");
        setSelectedModelName("");
        setModelsList([]);
        setExternalUrl("");
        setCustomImageUrl("");
      } else {
        throw new Error(res?.message || "Unable to queue notification.");
      }
    } catch (err: any) {
      console.error("Dispatch Error:", err);
      const msg = err.message || "Unable to queue notification. Please check backend connection.";
      setErrorMsg(msg);

      // Trigger Error Popup Modal
      setSweetModal({
        isOpen: true,
        type: "error",
        title: "Dispatch Failed",
        message: msg,
        showCancel: false,
        confirmText: "OK",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935]">
            Create & Dispatch Push Notification
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Send real-time mobile push notifications across all user segments, languages, and custom deep links
          </p>
        </div>

        <Link
          href="/notifications"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1B2935] text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>View Notification History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success Notification Queue Banner */}
      {successQueue && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {successQueue.message} <strong>(Queue ID #{successQueue.queueId})</strong>
            </span>
          </div>
          <Link
            href="/logs"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shrink-0 cursor-pointer"
          >
            Monitor Delivery Queue
          </Link>
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FORM CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleOpenConfirmPopup();
            }}
            className="space-y-6"
          >
            {/* SECTION 1: TARGET AUDIENCE */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
                  1. Target Audience
                </span>
                {estimatedRecipients !== null && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                    Est. Recipients: ~{estimatedRecipients.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B2935] block">
                    Audience Type
                  </label>
                  <select
                    value={audienceType}
                    onChange={(e) => setAudienceType(e.target.value as AudienceType)}
                    className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] font-medium outline-none focus:border-[#FF9540]"
                  >
                    <option value="all">All Registered Users</option>
                    <option value="specific_users">Specific Users</option>
                    <option value="users_by_language">Users by Language</option>
                    <option value="make_followers">Make Followers</option>
                    <option value="model_followers">Model Followers</option>
                  </select>
                </div>
              </div>

              {/* 1B. Specific Users Selector */}
              {audienceType === "specific_users" && (
                <div className="space-y-3 pt-1">
                  <label className="text-xs font-bold text-[#1B2935] block">
                    Search & Add Users
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search User ID, name, or email..."
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] focus:border-[#FF9540] focus:bg-white rounded-xl text-xs outline-none"
                    />
                    {loadingUsers && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-3 text-[#FF9540] animate-spin" />
                    )}
                  </div>

                  {/* Search Results Dropdown List */}
                  {userSearchQuery.trim() && (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E6E8EC] bg-white divide-y divide-slate-100 shadow-sm text-xs">
                      {userSearchResults.length > 0 ? (
                        userSearchResults.map((usr) => {
                          const isAlreadySelected = selectedUsers.some(
                            (u) => u.wpUserId === usr.wpUserId
                          );
                          return (
                            <button
                              key={usr.wpUserId}
                              type="button"
                              onClick={() => {
                                if (!isAlreadySelected) {
                                  setSelectedUsers([...selectedUsers, usr]);
                                }
                              }}
                              disabled={isAlreadySelected}
                              className="w-full p-2.5 flex items-center justify-between hover:bg-slate-50 disabled:opacity-50 transition text-left cursor-pointer"
                            >
                              <div>
                                <span className="font-mono font-bold text-[#FF9540] mr-2">
                                  #{usr.wpUserId}
                                </span>
                                <span className="font-bold text-[#1B2935] mr-2">{usr.name}</span>
                                <span className="text-[11px] text-[#6B7280]">
                                  ({usr.email})
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-[#FF9540]">
                                {isAlreadySelected ? "Added" : "+ Select"}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-[#6B7280]">
                          No users found.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Users Chips */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedUsers.map((usr) => (
                        <span
                          key={usr.wpUserId}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[#1B2935] border border-orange-200 rounded-xl text-xs font-bold"
                        >
                          <span>#{usr.wpUserId} {usr.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUsers(
                                selectedUsers.filter((u) => u.wpUserId !== usr.wpUserId)
                              )
                            }
                            className="text-[#FF9540] hover:text-[#FF8420] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 1C. Users by Language Selector */}
              {audienceType === "users_by_language" && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: "en", label: "English" },
                      { code: "th", label: "Thai" },
                      { code: "zh", label: "Chinese" },
                    ].map((l) => {
                      const isChecked = audienceLanguages.includes(l.code as LanguageCode);
                      return (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              if (audienceLanguages.length > 1) {
                                setAudienceLanguages(
                                  audienceLanguages.filter((c) => c !== l.code)
                                );
                              }
                            } else {
                              setAudienceLanguages([
                                ...audienceLanguages,
                                l.code as LanguageCode,
                              ]);
                            }
                          }}
                          className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer",
                            isChecked
                              ? "bg-orange-50 border-[#FF9540] text-[#FF9540]"
                              : "bg-slate-50 border-[#E6E8EC] text-[#6B7280]"
                          )}
                        >
                          <Check className={cn("w-3.5 h-3.5", isChecked ? "opacity-100" : "opacity-20")} />
                          <span>{l.label} ({l.code.toUpperCase()})</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Only eligible users using the selected language(s) will receive this notification.
                  </p>
                </div>
              )}

              {/* 1D. Make Followers */}
              {audienceType === "make_followers" && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-[#1B2935] block">
                    Select Make
                  </label>
                  {loadingMakes ? (
                    <div className="text-xs text-[#6B7280] py-2">Loading vehicle makes...</div>
                  ) : makesList.length > 0 ? (
                    <select
                      value={selectedMakeId}
                      onChange={(e) => handleMakeSelect(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] outline-none"
                    >
                      <option value="">-- Choose Make --</option>
                      {makesList.map((m) => {
                        const termId = getTermId(m);
                        const name = getMakeName(m);
                        const optVal = termId || name;
                        return (
                          <option key={optVal} value={optVal}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-xs text-[#6B7280] p-3 bg-slate-50 rounded-xl">
                      No vehicle makes are currently available.
                    </div>
                  )}
                  <p className="text-xs text-[#6B7280]">
                    Users following this make will receive the notification.
                  </p>
                </div>
              )}

              {/* 1E. Model Followers */}
              {audienceType === "model_followers" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1B2935] block">Make</label>
                    {loadingMakes ? (
                      <div className="text-xs text-[#6B7280] py-2">Loading vehicle makes...</div>
                    ) : (
                      <select
                        value={selectedMakeId}
                        onChange={(e) => handleMakeSelect(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] outline-none"
                      >
                        <option value="">-- Select Make --</option>
                        {makesList.map((m) => {
                          const termId = getTermId(m);
                          const name = getMakeName(m);
                          const optVal = termId || name;
                          return (
                            <option key={optVal} value={optVal}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1B2935] block">Model</label>
                    {loadingModels ? (
                      <div className="text-xs text-[#6B7280] py-2">Loading models...</div>
                    ) : (
                      <select
                        disabled={!selectedMakeId}
                        value={selectedModelId}
                        onChange={(e) => handleModelSelect(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select Model --</option>
                        {modelsList.map((m) => {
                          const termId = getTermId(m);
                          const name = getModelName(m);
                          const optVal = termId || name;
                          return (
                            <option key={optVal} value={optVal}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: NOTIFICATION TYPE */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
                  2. Notification Type
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2935] block">
                  Category / Event Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] font-medium outline-none focus:border-[#FF9540]"
                >
                  <option value="general_announcement">Announcement</option>
                  <option value="vehicle_notification">Vehicle Notification</option>
                  <option value="promotion">Promotion</option>
                  <option value="news">News</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* 2A. Vehicle Selector when Action Type = Vehicle */}
              {actionType === "vehicle" && (
                <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200/60 space-y-3">
                  <label className="text-xs font-bold text-[#1B2935] block">
                    Select Vehicle Listing
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
                    <input
                      type="text"
                      value={vehicleSearchQuery}
                      onChange={(e) => setVehicleSearchQuery(e.target.value)}
                      placeholder="Search listing ID, title, make, model..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E6E8EC] focus:border-[#FF9540] rounded-xl text-xs outline-none"
                    />
                    {loadingVehicles && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-3 text-[#FF9540] animate-spin" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pt-1">
                    {vehicleSearchResults.length > 0 ? (
                      vehicleSearchResults.map((car) => {
                        const isSelected = selectedVehicle?.listingId === car.listingId;
                        return (
                          <button
                            key={car.listingId}
                            type="button"
                            onClick={() => handleSelectVehicle(car)}
                            className={cn(
                              "p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer",
                              isSelected
                                ? "bg-white border-[#FF9540] ring-2 ring-orange-200"
                                : "bg-white border-[#E6E8EC] hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={car.imageUrl}
                                alt={car.title}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-[#1B2935] text-xs truncate">
                                  {car.title}
                                </p>
                                <p className="text-[11px] font-mono text-[#FF9540]">
                                  ID #{car.listingId} · {car.formattedPrice}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-[#FF9540] shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-[#6B7280] bg-white rounded-xl border border-slate-200">
                        No vehicle listings found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: MULTI-LANGUAGE CONTENT */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
                  3. Multi-Language Content
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Enable target languages & provide title/message
                </span>
              </div>

              {/* Language Enable Toggles */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B2935] block">
                  Target Content Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: "en", label: "English" },
                    { code: "th", label: "Thai" },
                    { code: "zh", label: "Chinese" },
                  ].map((lang) => {
                    const isEnabled = enabledLanguages.includes(lang.code as LanguageCode);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleToggleEnableLanguage(lang.code as LanguageCode)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer",
                          isEnabled
                            ? "bg-orange-50 border-[#FF9540] text-[#FF9540]"
                            : "bg-[#F7F8FA] border-[#E6E8EC] text-[#6B7280]"
                        )}
                      >
                        <Check className={cn("w-3.5 h-3.5", isEnabled ? "opacity-100" : "opacity-20")} />
                        <span>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Language Editor Tabs */}
              <div className="border-b border-slate-200 flex gap-2 pt-2">
                {enabledLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLangTab(lang)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer uppercase",
                      activeLangTab === lang
                        ? "border-[#FF9540] text-[#FF9540]"
                        : "border-transparent text-[#6B7280] hover:text-[#1B2935]"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Active Language Input Form */}
              <div
                dir="ltr"
                className="space-y-4 pt-1"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1B2935] block">
                    Title ({activeLangTab.toUpperCase()}) *
                  </label>
                  <input
                    type="text"
                    value={translations[activeLangTab]?.title || ""}
                    onChange={(e) => handleTranslationChange("title", e.target.value)}
                    placeholder={
                      activeLangTab === "th"
                        ? "เช่น: รถยนต์มาใหม่ประจำสัปดาห์..."
                        : "e.g., Special Price Drop Alert!"
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] focus:border-[#FF9540] focus:bg-white text-xs font-medium text-[#1B2935] rounded-xl outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1B2935] block">
                    Message Body ({activeLangTab.toUpperCase()}) *
                  </label>
                  <textarea
                    rows={3}
                    value={translations[activeLangTab]?.message || ""}
                    onChange={(e) => handleTranslationChange("message", e.target.value)}
                    placeholder={
                      activeLangTab === "th"
                        ? "เช่น: ตรวจสอบข้อเสนอสุดพิเศษสำหรับ Honda Civic..."
                        : "e.g., Check out the latest discount on your favourited vehicle."
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] focus:border-[#FF9540] focus:bg-white text-xs font-medium text-[#1B2935] rounded-xl outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: ACTION / DESTINATION ON TAP */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
                  4. Action on Tap (Destination)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B2935] block">
                    Destination Screen
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => {
                      setActionType(e.target.value as ActionType);
                      setActionManuallyChanged(true);
                    }}
                    className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#1B2935] font-medium outline-none focus:border-[#FF9540]"
                  >
                    <option value="inbox">Notification Inbox</option>
                    <option value="vehicle">Vehicle Listing Detail</option>
                    <option value="favourites">My Saved Favourites</option>
                    <option value="search">Search Screen</option>
                    <option value="buy_car">Buy Car Directory</option>
                    <option value="external_url">External Web URL</option>
                    <option value="no_action">No Action (Silent Alert)</option>
                  </select>
                </div>

                {actionType === "external_url" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1B2935] block">
                      Target Web URL *
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://wowcar.co.th/special-promo"
                      className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] focus:border-[#FF9540] rounded-xl text-xs outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: IMAGE ATTACHMENT */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
                  5. Rich Media Attachment
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#1B2935] cursor-pointer">
                    <input
                      type="radio"
                      name="imageOption"
                      value="none"
                      checked={imageOption === "none"}
                      onChange={() => setImageOption("none")}
                      className="accent-[#FF9540]"
                    />
                    <span>No Image</span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold text-[#1B2935] cursor-pointer",
                      !selectedVehicle && "opacity-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="imageOption"
                      value="vehicle"
                      disabled={!selectedVehicle}
                      checked={imageOption === "vehicle"}
                      onChange={() => setImageOption("vehicle")}
                      className="accent-[#FF9540]"
                    />
                    <span>Use Selected Vehicle Image</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#1B2935] cursor-pointer">
                    <input
                      type="radio"
                      name="imageOption"
                      value="custom"
                      checked={imageOption === "custom"}
                      onChange={() => setImageOption("custom")}
                      className="accent-[#FF9540]"
                    />
                    <span>Custom Image URL</span>
                  </label>
                </div>

                {imageOption === "custom" && (
                  <div className="space-y-1 pt-1">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] focus:border-[#FF9540] rounded-xl text-xs outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 6: SCHEDULING & TIMING */}
            <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#1B2935] uppercase tracking-wider">
                  6. Delivery Timing
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#1B2935] cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="now"
                      checked={deliveryOption === "now"}
                      onChange={() => setDeliveryOption("now")}
                      className="accent-[#FF9540]"
                    />
                    <span>Send Immediately</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#1B2935] cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="schedule"
                      checked={deliveryOption === "schedule"}
                      onChange={() => setDeliveryOption("schedule")}
                      className="accent-[#FF9540]"
                    />
                    <span>Schedule for Later</span>
                  </label>
                </div>

                {deliveryOption === "schedule" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1B2935] block">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1B2935] block">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* VALIDATION ERROR BANNER */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* ERROR MSG FROM DISPATCH */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!!validationError || isSubmitting}
                className="w-full py-3.5 px-6 bg-[#FF9540] hover:bg-[#FF8420] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Queueing Notification...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {deliveryOption === "schedule"
                        ? "Schedule Notification"
                        : "Send Notification Now"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: STICKY LIVE PREVIEW */}
        <div className="lg:col-span-5 sticky top-20">
          <NotificationPreview
            translations={translations}
            selectedLang={activeLangTab}
            onSelectLang={(lang) => setActiveLangTab(lang)}
            imageUrl={effectiveImageUrl}
            actionType={actionType}
            listingId={selectedVehicle?.listingId}
          />
        </div>
      </div>

      {/* SweetModal Popup Dialog */}
      <SweetModal
        isOpen={sweetModal.isOpen}
        onClose={() => setSweetModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={sweetModal.onConfirm}
        type={sweetModal.type}
        title={sweetModal.title}
        message={sweetModal.message}
        showCancel={sweetModal.showCancel}
        confirmText={sweetModal.confirmText}
      />
    </div>
  );
}
