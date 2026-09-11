"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ProfileService } from "@/lib/api/services";
import { UserProfile } from "@/types";
import { FormProcessingModal, ProcessingModalState } from "@/components/ui/FormProcessingModal";
import {
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Share2,
  Camera,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

/**
 * Extracts initials from display name.
 * e.g., "BenzRajchakru" => "BR", "Benz Rajchakru" => "BR", "Deon Reeder" => "DR"
 */
function getUserInitials(name: string): string {
  if (!name) return "AD";
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const capitals = clean.match(/[A-Z]/g);
  if (capitals && capitals.length >= 2) {
    return (capitals[0] + capitals[1]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Safely decodes HTML entities (e.g., &#x1F1F9&#x1F1ED +66 => 🇹🇭 +66)
 * without using dangerouslySetInnerHTML.
 */
function decodeHtmlEntities(raw: string): string {
  if (!raw) return "";
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(raw, "text/html");
      return doc.documentElement.textContent || raw;
    } catch (_) {
      // Fallback below
    }
  }
  return raw
    .replace(/&#x([0-9a-fA-F]+);?/g, (match: string, hex: string): string => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch (_) {
        return match;
      }
    })
    .replace(/&#([0-9]+);?/g, (match: string, dec: string): string => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch (_) {
        return match;
      }
    });
}

import { useTranslation } from "@/i18n/useTranslation";

export default function SettingsPage() {
  const { t } = useTranslation();
  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Authoritative Loaded Profile State
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);

  // Editable Form State
  const [form, setForm] = useState({
    email: "",
    display_name: "",
    first_name: "",
    last_name: "",
    phone_country_code: "",
    phone: "",
    address: "",
    lat: "",
    lng: "",
    line_id: "",
    description: "",
    facebook_profile: "",
    instagram_profile: "",
    you_tube_profile: "",
    linked_in_profile: "",
    twitter_profile: "",
    tiktok_profile: "",
    image: 0,
  });

  // Last Saved Form Baseline for Unsaved Changes (Dirty Tracking)
  const [lastSavedForm, setLastSavedForm] = useState<string>("");

  // Profile Image Upload State
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing Modal State
  const [modalState, setModalState] = useState<ProcessingModalState>("idle");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load User Profile
  const fetchProfile = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await ProfileService.getProfile();
      const profileData = res?.data;

      if (profileData) {
        setInitialProfile(profileData);

        const decodedPhoneCode = decodeHtmlEntities(profileData.phone_country_code || "");

        const loadedForm = {
          email: profileData.email || "",
          display_name: profileData.display_name || "",
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone_country_code: decodedPhoneCode,
          phone: profileData.phone || "",
          address: profileData.address || "",
          lat: profileData.lat || "",
          lng: profileData.lng || "",
          line_id: profileData.line_id || "",
          description: profileData.description || "",
          facebook_profile: profileData.facebook_profile || "",
          instagram_profile: profileData.instagram_profile || "",
          you_tube_profile: profileData.you_tube_profile || "",
          linked_in_profile: profileData.linked_in_profile || "",
          twitter_profile: profileData.twitter_profile || "",
          tiktok_profile: profileData.tiktok_profile || "",
          image: profileData.image || 0,
        };

        setForm(loadedForm);
        setLastSavedForm(JSON.stringify(loadedForm));
      } else {
        throw new Error("Failed to parse user profile data.");
      }
    } catch (err: any) {
      console.error("Profile load error:", err);
      setLoadError(err?.message || "Failed to load profile settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Compute whether the form is dirty (differs from last saved baseline)
  const isDirty = useMemo(() => {
    if (!lastSavedForm) return false;
    return JSON.stringify(form) !== lastSavedForm;
  }, [form, lastSavedForm]);

  // Form Field Change Handler
  const updateFormField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Image Upload Handler
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);

    // Client-side validation: JPG/JPEG, PNG, WEBP, <= 10MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setImageUploadError("Unsupported image format. Only JPG, PNG, and WEBP are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > maxSize) {
      setImageUploadError("Image size exceeds the 10 MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Local Preview immediately
    const tempPreviewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(tempPreviewUrl);
    setIsUploadingImage(true);

    try {
      const uploadRes = await ProfileService.uploadImage(file);
      if (uploadRes && uploadRes.data?.attachment_id) {
        // Update form's attachment ID & set preview URL from returned image_url
        updateFormField("image", uploadRes.data.attachment_id);
        if (uploadRes.data.image_url) {
          setImagePreviewUrl(uploadRes.data.image_url);
        }
      }
    } catch (err: any) {
      console.error("Profile image upload error:", err);
      setImageUploadError(err?.message || "Failed to upload profile image.");
      setImagePreviewUrl(null);
    } finally {
      setIsUploadingImage(false);
      if (tempPreviewUrl && tempPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(tempPreviewUrl);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || isSubmitting) return;

    setIsSubmitting(true);
    setModalState("processing");
    setModalErrorMessage("");

    try {
      // Omit username (read-only) and image (uploaded separately) when submitting update
      const updatePayload: Record<string, any> = {
        email: form.email.trim(),
        display_name: form.display_name.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_country_code: form.phone_country_code.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        lat: form.lat.trim(),
        lng: form.lng.trim(),
        line_id: form.line_id.trim(),
        description: form.description.trim(),
        facebook_profile: form.facebook_profile.trim(),
        instagram_profile: form.instagram_profile.trim(),
        you_tube_profile: form.you_tube_profile.trim(),
        linked_in_profile: form.linked_in_profile.trim(),
        twitter_profile: form.twitter_profile.trim(),
        tiktok_profile: form.tiktok_profile.trim(),
      };

      const res = await ProfileService.updateProfile(updatePayload);

      // Use returned profile as new authoritative state if provided
      if (res && res.data) {
        const fresh = res.data;
        setInitialProfile((prev) => (prev ? { ...prev, ...fresh } : fresh));

        const decodedPhoneCode = decodeHtmlEntities(fresh.phone_country_code || "");
        const updatedForm = {
          email: fresh.email || "",
          display_name: fresh.display_name || "",
          first_name: fresh.first_name || "",
          last_name: fresh.last_name || "",
          phone_country_code: decodedPhoneCode,
          phone: fresh.phone || "",
          address: fresh.address || "",
          lat: fresh.lat || "",
          lng: fresh.lng || "",
          line_id: fresh.line_id || "",
          description: fresh.description || "",
          facebook_profile: fresh.facebook_profile || "",
          instagram_profile: fresh.instagram_profile || "",
          you_tube_profile: fresh.you_tube_profile || "",
          linked_in_profile: fresh.linked_in_profile || "",
          twitter_profile: fresh.twitter_profile || "",
          tiktok_profile: fresh.tiktok_profile || "",
          image: fresh.image || 0,
        };

        setForm(updatedForm);
        setLastSavedForm(JSON.stringify(updatedForm));
      } else {
        setLastSavedForm(JSON.stringify(form));
      }

      setModalState("success");
    } catch (err: any) {
      console.error("Save profile error:", err);
      setModalErrorMessage(err?.message || "An error occurred while saving profile changes.");
      setModalState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-2 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-xl w-full" />
        <div className="h-44 bg-slate-200 rounded-xl w-full" />
        <div className="h-64 bg-slate-200 rounded-xl w-full" />
        <div className="h-48 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#1B2935]">{t("profile.loadError")}</h2>
        <p className="text-xs text-[#6B7280]">{loadError}</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("profile.retryLoad")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E6E8EC] shadow-xs flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935] flex items-center gap-2">
            <User className="w-5 h-5 text-[#1B2935]" />
            <span>{t("page.profileTitle")}</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {t("profile.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={!isDirty || isSubmitting}
          className="px-6 py-2.5 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{t("common.saveChanges")}</span>
        </button>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* 1. Profile Photo Card */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-[#1B2935]">{t("profile.photo")}</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-[#E6E8EC] overflow-hidden flex items-center justify-center text-slate-400 font-bold shadow-xs">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${(initialProfile?.display_name || initialProfile?.username || "").toLowerCase().includes("benz") ? "bg-[#0078d6]" : "bg-[#1B2935]"} text-white text-xl font-bold flex items-center justify-center select-none`}>
                    {getUserInitials(initialProfile?.display_name || initialProfile?.username || "")}
                  </div>
                )}
              </div>
              {isUploadingImage && (
                <div className="absolute inset-0 rounded-2xl bg-slate-950/60 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#F7F8FA] border border-[#E6E8EC] hover:bg-slate-100 text-[#1B2935] text-xs font-bold rounded-xl transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t("profile.changePhoto")}</span>
                </button>
              </div>

              <p className="text-[11px] text-[#6B7280]">
                {t("profile.photoHelp")}
              </p>

              {imageUploadError && (
                <p className="text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                  {imageUploadError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Personal Information Card */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-[#1B2935]">{t("profile.personalInfo")}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.firstName")}</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => updateFormField("first_name", e.target.value)}
                placeholder="e.g. Deon"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.lastName")}</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => updateFormField("last_name", e.target.value)}
                placeholder="e.g. Reeder"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.displayName")}</label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => updateFormField("display_name", e.target.value)}
                placeholder="e.g. WowCar"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Username (READ ONLY) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#1B2935]">{t("field.username")}</label>
                <span className="text-[10px] text-slate-400 font-medium">{t("common.readOnly")}</span>
              </div>
              <input
                type="text"
                disabled
                value={initialProfile?.username || ""}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-[#E6E8EC] rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed select-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.email")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                placeholder="admin@domain.com"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Country Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.countryCode")}</label>
              <input
                type="text"
                value={form.phone_country_code}
                onChange={(e) => updateFormField("phone_country_code", e.target.value)}
                placeholder="e.g. +66"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.phone")}</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateFormField("phone", e.target.value)}
                placeholder="e.g. 0943516600"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>
          </div>
        </div>

        {/* 3. Location & Contact Card */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.location")}</h2>
          </div>

          <div className="space-y-4">
            {/* Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.address")}</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => updateFormField("address", e.target.value)}
                placeholder="1195 Phahonyothin Rd, Phaya Thai, Bangkok 10400, Thailand"
                className="w-full p-3.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935] leading-relaxed"
              />
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1B2935]">{t("field.latitude")}</label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={form.lat}
                  onChange={(e) => updateFormField("lat", e.target.value)}
                  placeholder="13.7742309"
                  className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1B2935]">{t("field.longitude")}</label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.lng}
                  onChange={(e) => updateFormField("lng", e.target.value)}
                  placeholder="100.4085338"
                  className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
                />
              </div>
            </div>

            {/* LINE ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.lineId")}</label>
              <input
                type="text"
                value={form.line_id}
                onChange={(e) => updateFormField("line_id", e.target.value)}
                placeholder="benzrajchakru"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Description / Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.bio")}</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => updateFormField("description", e.target.value)}
                placeholder="Enter profile bio description..."
                className="w-full p-3.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 4. Social Profiles Card */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-[#1B2935]">{t("profile.social")}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Facebook */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">Facebook</label>
              <input
                type="url"
                value={form.facebook_profile}
                onChange={(e) => updateFormField("facebook_profile", e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">Instagram</label>
              <input
                type="url"
                value={form.instagram_profile}
                onChange={(e) => updateFormField("instagram_profile", e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* YouTube */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">YouTube</label>
              <input
                type="url"
                value={form.you_tube_profile}
                onChange={(e) => updateFormField("you_tube_profile", e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">LinkedIn</label>
              <input
                type="url"
                value={form.linked_in_profile}
                onChange={(e) => updateFormField("linked_in_profile", e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* X / Twitter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">X / Twitter</label>
              <input
                type="url"
                value={form.twitter_profile}
                onChange={(e) => updateFormField("twitter_profile", e.target.value)}
                placeholder="https://x.com/..."
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">TikTok</label>
              <input
                type="url"
                value={form.tiktok_profile}
                onChange={(e) => updateFormField("tiktok_profile", e.target.value)}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="px-8 py-3 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t("common.saveChanges")}</span>
          </button>
        </div>
      </form>

      {/* Professional Blocking Processing Modal */}
      <FormProcessingModal
        isOpen={modalState !== "idle"}
        state={modalState}
        mode="profile"
        errorMessage={modalErrorMessage}
        onCloseError={() => setModalState("idle")}
        onContinueEditing={() => setModalState("idle")}
      />
    </div>
  );
}
