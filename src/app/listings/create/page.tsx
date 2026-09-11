"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListingService, ProfileService } from "@/lib/api/services";
import { AutocompleteSelect, OptionItem } from "@/components/ui/AutocompleteSelect";
import { MultiSelectAutocomplete } from "@/components/ui/MultiSelectAutocomplete";
import { ImageUploader, ImageItem } from "@/components/ui/ImageUploader";
import { FormProcessingModal, ProcessingModalState } from "@/components/ui/FormProcessingModal";
import {
  Car,
  FileText,
  ShieldCheck,
  Sparkles,
  MapPin,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Eye,
  AlertCircle,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";

import { useTranslation } from "@/i18n/useTranslation";

import { REASONS_TO_BUY_OPTIONS } from "@/config/reasonsToBuy";

const getReasonsToBuyOptions = (translateFn: (key: any) => string): OptionItem[] => {
  return REASONS_TO_BUY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: translateFn(opt.labelKey),
  }));
};

const normalizeTaxonomyList = (rawItems: any[]): OptionItem[] => {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((item: any) => {
    if (typeof item === "string" || typeof item === "number") {
      return {
        value: String(item),
        label: String(item),
        termId: item,
      };
    }
    const label = item.name || item.english || item.thai || item.chinese || String(item.term_id ?? item.id ?? "");
    const value = String(item.term_id ?? item.id ?? "");
    return {
      value,
      label,
      name: item.name,
      termId: item.term_id ?? item.id,
      thai: item.thai,
      english: item.english,
      chinese: item.chinese,
    };
  });
};

const getModelOptions = (selectedMakeId: string, currentDataset: any) => {
  if (!selectedMakeId || !currentDataset?.makes_models) return [];
  const entries = Object.entries(currentDataset.makes_models || {});
  const selectedMakeEntry = entries.find(
    ([, makeData]: any) => String(makeData.term_id) === String(selectedMakeId)
  );

  if (!selectedMakeEntry) return [];
  const [, makeData]: any = selectedMakeEntry;

  return Object.entries(makeData.models || {}).map(([modelName, termId]) => ({
    label: modelName,
    value: String(termId),
    termId: Number(termId),
  }));
};

export default function CreateListingPage() {
  const router = useRouter();
  const { t, listivoLanguage } = useTranslation();

  // Loading & Dataset state
  const [loadingDataset, setLoadingDataset] = useState(true);

  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<any>(null);

  // Normalization Option Lists
  const [makesList, setMakesList] = useState<OptionItem[]>([]);

  const [fieldOptions, setFieldOptions] = useState<{
    body_style: OptionItem[];
    fuel_type: OptionItem[];
    transmission: OptionItem[];
    drivetrain: OptionItem[];
    color: OptionItem[];
    engine_size: OptionItem[];
    door_count: OptionItem[];
    safety_features: OptionItem[];
    comfort_features: OptionItem[];
    image_tags: OptionItem[];
    reasons_to_buy: OptionItem[];
  }>({
    body_style: [],
    fuel_type: [],
    transmission: [],
    drivetrain: [],
    color: [],
    engine_size: [],
    door_count: [],
    safety_features: [],
    comfort_features: [],
    image_tags: [],
    reasons_to_buy: getReasonsToBuyOptions(t),
  });

  // Form State
  const [form, setForm] = useState({
    reference_code: "",
    price: "",
    year: "",
    mileage: "",
    model_specific: "",

    make: "" as string | number,
    model: "" as string | number,
    body_style: "" as string | number,
    door_count: "" as string | number,
    color: "" as string | number,
    fuel_type: "" as string | number,
    transmission: "" as string | number,
    drivetrain: "" as string | number,
    engine_size: "" as string | number,

    reasons_to_buy: [] as string[],
    safety_features: [] as (string | number)[],
    comfort_features: [] as (string | number)[],
    image_tags: "" as string | number,

    address: "",
    lat: "",
    lng: "",

    line_id: "",
    video_url: "",
  });

  const availableModels = useMemo(() => {
    if (!form?.make || !dataset) return [];
    return getModelOptions(String(form.make), dataset);
  }, [form?.make, dataset]);

  // Multilingual description state
  const [activeDescTab, setActiveDescTab] = useState<"thai" | "english" | "chinese">("thai");
  const [descriptions, setDescriptions] = useState({
    thai: "",
    english: "",
    chinese: "",
  });

  // Images state
  const [images, setImages] = useState<ImageItem[]>([]);

  // Validation errors & Submitting state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Blocking Processing Modal State
  const [modalState, setModalState] = useState<ProcessingModalState>("idle");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [createdListingId, setCreatedListingId] = useState("");

  // Helper to generate dynamic title: {Year} {Make} {Model} {Model Specific} using display names
  const getGeneratedTitle = (
    yearVal: string,
    makeVal: string | number,
    modelVal: string | number,
    modelSpecificVal: string
  ): string => {
    // 1. Resolve Make Label
    let makeLabel = "";
    if (makeVal) {
      const foundMake = makesList.find(
        (m: OptionItem) => String(m.value) === String(makeVal) || String(m.termId ?? "") === String(makeVal)
      );
      makeLabel = foundMake ? foundMake.label : String(makeVal).trim();
    }

    // 2. Resolve Model Label
    let modelLabel = "";
    if (modelVal) {
      const foundModel = availableModels.find(
        (m: OptionItem) => String(m.value) === String(modelVal) || String(m.termId ?? "") === String(modelVal)
      );
      modelLabel = foundModel ? foundModel.label : String(modelVal).trim();
    }

    return [yearVal, makeLabel, modelLabel, modelSpecificVal]
      .map((val) => String(val || "").trim())
      .filter((val) => val.length > 0 && val !== "undefined" && val !== "null")
      .join(" ")
      .trim();
  };

  const processDataset = (data: any) => {
    if (!data) return;

    // Normalize Makes
    const makes: OptionItem[] = Object.entries(data.makes_models || {}).map(
      ([makeName, makeData]: any) => ({
        label: makeName,
        value: String(makeData.term_id),
        termId: makeData.term_id,
      })
    );

    setMakesList(makes);

    // Normalize Taxonomy Fields
    const fields = data.fields || {};

    setFieldOptions({
      body_style: normalizeTaxonomyList(fields.body_style || []),
      fuel_type: normalizeTaxonomyList(fields.fuel_type || []),
      transmission: normalizeTaxonomyList(fields.transmission || []),
      drivetrain: normalizeTaxonomyList(fields.drivetrain || []),
      color: normalizeTaxonomyList(fields.color || []),
      engine_size: normalizeTaxonomyList(fields.engine_size || []),
      door_count: normalizeTaxonomyList(fields.door_count || []),
      safety_features: normalizeTaxonomyList(fields.safety_features || []),
      comfort_features: normalizeTaxonomyList(fields.comfort_features || []),
      image_tags: normalizeTaxonomyList(fields.image_tags || []),
      reasons_to_buy: getReasonsToBuyOptions(t),
    });
  };

  useEffect(() => {
    setFieldOptions((prev) => ({
      ...prev,
      reasons_to_buy: getReasonsToBuyOptions(t),
    }));
  }, [t]);

  // Fetch Dataset
  const fetchDataset = async (currentLang: string = listivoLanguage) => {
    setLoadingDataset(true);
    setDatasetError(null);
    try {
      const data = await ListingService.getDataset(currentLang);
      setDataset(data);
      processDataset(data);
    } catch (err: any) {
      console.error("Failed to load listing dataset:", err);
      setDatasetError(err?.message || "Failed to load vehicle taxonomy options. Please try again.");
    } finally {
      setLoadingDataset(false);
    }
  };

  // Ref to track fields manually touched by user before or after profile loads
  const userEditedFieldsRef = useRef<{ address?: boolean; lat?: boolean; lng?: boolean; line_id?: boolean }>({});

  // Fetch Dealer Profile for initial Location & Contact defaults
  const fetchProfileDefaults = async () => {
    try {
      const res = await ProfileService.getProfile();
      const profile = res?.data;
      if (profile) {
        setForm((prev) => ({
          ...prev,
          address: !userEditedFieldsRef.current.address && !prev.address ? (profile.address || "") : prev.address,
          lat: !userEditedFieldsRef.current.lat && !prev.lat ? (profile.lat || "") : prev.lat,
          lng: !userEditedFieldsRef.current.lng && !prev.lng ? (profile.lng || "") : prev.lng,
          line_id: !userEditedFieldsRef.current.line_id && !prev.line_id ? (profile.line_id || "") : prev.line_id,
        }));
      }
    } catch (err) {
      console.warn("Could not prefill dealer profile defaults for create listing:", err);
    }
  };

  useEffect(() => {
    fetchDataset(listivoLanguage);
    fetchProfileDefaults();
  }, [listivoLanguage]);

  // When Make changes
  const handleMakeChange = (selectedMakeOpt: OptionItem | null) => {
    const newMakeId = selectedMakeOpt
      ? String(selectedMakeOpt.termId ?? selectedMakeOpt.value)
      : "";

    setForm((prev) => ({ ...prev, make: newMakeId, model: "" }));
    setErrors((prev) => ({ ...prev, make: "", model: "" }));
  };

  // Form Field Update Helper
  const updateForm = (field: string, value: any) => {
    if (["address", "lat", "lng", "line_id"].includes(field)) {
      userEditedFieldsRef.current[field as "address" | "lat" | "lng" | "line_id"] = true;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const generatedTitle = getGeneratedTitle(
      form.year,
      form.make,
      form.model,
      form.model_specific
    );

    if (!generatedTitle) {
      newErrors.title = "Listing title could not be generated. Please specify Year, Make, and Model.";
    }
    if (!form.make) newErrors.make = "Please select a Make";
    if (!form.model) newErrors.model = "Please select a Model";

    // Year
    if (!form.year) {
      newErrors.year = "Year is required";
    } else if (isNaN(Number(form.year)) || Number(form.year) < 1900 || Number(form.year) > 2030) {
      newErrors.year = "Enter a valid 4-digit year";
    }

    // Price
    if (!form.price) {
      newErrors.price = "Price is required";
    } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      newErrors.price = "Price must be a valid non-negative number";
    }

    // Mileage
    if (form.mileage === "") {
      newErrors.mileage = "Mileage is required";
    } else if (isNaN(Number(form.mileage)) || Number(form.mileage) < 0) {
      newErrors.mileage = "Mileage must be a non-negative number";
    }

    // Lat/Lng optional format check
    if (form.lat && isNaN(Number(form.lat))) {
      newErrors.lat = "Latitude must be numeric";
    }
    if (form.lng && isNaN(Number(form.lng))) {
      newErrors.lng = "Longitude must be numeric";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Re-generate final title at submit time for submission safety
    const finalGeneratedTitle = getGeneratedTitle(
      form.year,
      form.make,
      form.model,
      form.model_specific
    );

    if (!finalGeneratedTitle) {
      setModalErrorMessage("Could not generate a valid listing title. Please specify Year, Make, and Model.");
      setModalState("error");
      return;
    }

    setSubmitting(true);
    setModalState("processing");
    setModalErrorMessage("");

    try {
      const formData = new FormData();

      // Automatically generated title sent to API payload
      formData.append("title", finalGeneratedTitle);
      formData.append("reference_code", form.reference_code.trim());
      formData.append("price", String(form.price));
      formData.append("year", String(form.year));
      formData.append("mileage", String(form.mileage));
      formData.append("model_specific", form.model_specific.trim());
      formData.append("reasons_to_buy", JSON.stringify(form.reasons_to_buy));

      // Vehicle Details taxonomy term IDs
      if (form.make) formData.append("make", String(form.make));
      if (form.model) formData.append("model", String(form.model));
      if (form.body_style) formData.append("body_style", String(form.body_style));
      if (form.door_count) formData.append("door_count", String(form.door_count));
      if (form.color) formData.append("color", String(form.color));
      if (form.fuel_type) formData.append("fuel_type", String(form.fuel_type));
      if (form.transmission) formData.append("transmission", String(form.transmission));
      if (form.drivetrain) formData.append("drivetrain", String(form.drivetrain));
      if (form.engine_size) formData.append("engine_size", String(form.engine_size));

      // Multi-select features (term IDs)
      formData.append("safety_features", JSON.stringify(form.safety_features));
      formData.append("comfort_features", JSON.stringify(form.comfort_features));
      formData.append("image_tags", JSON.stringify(form.image_tags !== "" ? [Number(form.image_tags) || form.image_tags] : []));

      // Multilingual descriptions
      formData.append("descriptions", JSON.stringify(descriptions));

      // Location
      formData.append("address", form.address.trim());
      formData.append("lat", form.lat ? String(form.lat) : "");
      formData.append("lng", form.lng ? String(form.lng) : "");

      // Additional Info
      formData.append("line_id", form.line_id.trim());
      formData.append("video", JSON.stringify({ url: form.video_url.trim(), embed: "" }));

      // Images in exact array order
      images.forEach((img) => {
        formData.append("images", img.file);
      });

      const response = await ListingService.createListing(formData);

      const listingId = String(response?.id || response?.listing_id || "12345");
      setCreatedListingId(listingId);
      setModalState("success");
    } catch (err: any) {
      console.error("Create listing error:", err);
      setModalErrorMessage(err?.message || "An unexpected error occurred while creating the listing.");
      setModalState("error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      reference_code: "",
      price: "",
      year: "",
      mileage: "",
      model_specific: "",
      reasons_to_buy: [] as string[],
      make: "",
      model: "",
      body_style: "",
      door_count: "",
      color: "",
      fuel_type: "",
      transmission: "",
      drivetrain: "",
      engine_size: "",
      safety_features: [],
      comfort_features: [],
      image_tags: "",
      address: "",
      lat: "",
      lng: "",
      line_id: "",
      video_url: "",
    });
    setDescriptions({ thai: "", english: "", chinese: "" });
    setImages([]);
    setErrors({});
    userEditedFieldsRef.current = {};
    fetchProfileDefaults();
  };

  if (loadingDataset) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto p-2">
        <div className="h-16 bg-slate-200 rounded-xl w-full" />
        <div className="h-64 bg-slate-200 rounded-xl w-full" />
        <div className="h-64 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  if (datasetError) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#1B2935]">Dataset Loading Error</h2>
        <p className="text-xs text-[#6B7280]">{datasetError}</p>
        <button
          onClick={() => fetchDataset()}
          className="px-4 py-2 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading Dataset</span>
        </button>
      </div>
    );
  }

  const liveTitlePreview = getGeneratedTitle(
    form.year,
    form.make,
    form.model,
    form.model_specific
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner with Prominent Live Generated Title Heading */}
      <div className="bg-white p-5 rounded-xl border border-[#E6E8EC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <Car className="w-4 h-4 text-[#1B2935]" />
            <span>{t("page.createTitle")}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B2935] tracking-tight">
            {liveTitlePreview || t("page.createTitle")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vehicles"
            className="px-3.5 py-2 bg-white border border-[#E6E8EC] hover:bg-slate-50 text-[#1B2935] text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t("form.backToVehicles")}</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Basic Information Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.basic")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.refCode")}</label>
              <input
                type="text"
                value={form.reference_code}
                onChange={(e) => updateForm("reference_code", e.target.value)}
                placeholder="e.g. REF-2026-99"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">
                {t("field.priceThb")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                placeholder="e.g. 759000"
                className={`w-full px-3.5 py-2.5 bg-[#F7F8FA] border rounded-xl text-xs font-medium outline-none transition ${
                  errors.price ? "border-rose-400 focus:border-rose-500" : "border-[#E6E8EC] focus:border-[#1B2935]"
                }`}
              />
              {errors.price && <p className="text-[11px] font-medium text-rose-500">{errors.price}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">
                {t("field.year")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={form.year}
                onChange={(e) => updateForm("year", e.target.value)}
                placeholder="e.g. 2022"
                className={`w-full px-3.5 py-2.5 bg-[#F7F8FA] border rounded-xl text-xs font-medium outline-none transition ${
                  errors.year ? "border-rose-400 focus:border-rose-500" : "border-[#E6E8EC] focus:border-[#1B2935]"
                }`}
              />
              {errors.year && <p className="text-[11px] font-medium text-rose-500">{errors.year}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">
                {t("field.mileageKm")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.mileage}
                onChange={(e) => updateForm("mileage", e.target.value)}
                placeholder="e.g. 35000"
                className={`w-full px-3.5 py-2.5 bg-[#F7F8FA] border rounded-xl text-xs font-medium outline-none transition ${
                  errors.mileage ? "border-rose-400 focus:border-rose-500" : "border-[#E6E8EC] focus:border-[#1B2935]"
                }`}
              />
              {errors.mileage && <p className="text-[11px] font-medium text-rose-500">{errors.mileage}</p>}
            </div>

          </div>
        </div>

        {/* 2. Vehicle Details Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.details")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make */}
            <AutocompleteSelect
              label={t("field.make")}
              required
              options={makesList}
              value={form.make}
              onChange={handleMakeChange}
              placeholder={t("placeholder.select", { field: t("field.make") })}
              error={errors.make}
            />

            {/* Model (Dependent on Make) */}
            <AutocompleteSelect
              label={t("field.model")}
              required
              options={availableModels}
              value={form.model}
              onChange={(opt) => updateForm("model", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={form.make ? t("placeholder.select", { field: t("field.model") }) : "Select a Make first"}
              disabled={!form.make}
              error={errors.model}
            />

            {/* Model Specific / Variant */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.modelSpecific")}</label>
              <input
                type="text"
                value={form.model_specific}
                onChange={(e) => updateForm("model_specific", e.target.value)}
                placeholder="e.g. 2.5 HEV Premium"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>

            {/* Body Type */}
            <AutocompleteSelect
              label={t("field.bodyType")}
              options={fieldOptions.body_style}
              value={form.body_style}
              onChange={(opt) => updateForm("body_style", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.bodyType") })}
            />

            {/* Door Count */}
            <AutocompleteSelect
              label={t("field.doorCount")}
              options={fieldOptions.door_count}
              value={form.door_count}
              onChange={(opt) => updateForm("door_count", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.doorCount") })}
            />

            {/* Colour */}
            <AutocompleteSelect
              label={t("field.colour")}
              options={fieldOptions.color}
              value={form.color}
              onChange={(opt) => updateForm("color", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.colour") })}
            />

            {/* Fuel Type */}
            <AutocompleteSelect
              label={t("field.fuelType")}
              options={fieldOptions.fuel_type}
              value={form.fuel_type}
              onChange={(opt) => updateForm("fuel_type", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.fuelType") })}
            />

            {/* Transmission */}
            <AutocompleteSelect
              label={t("field.transmission")}
              options={fieldOptions.transmission}
              value={form.transmission}
              onChange={(opt) => updateForm("transmission", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.transmission") })}
            />

            {/* Drivetrain */}
            <AutocompleteSelect
              label={t("field.drivetrain")}
              options={fieldOptions.drivetrain}
              value={form.drivetrain}
              onChange={(opt) => updateForm("drivetrain", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.drivetrain") })}
            />

            {/* Engine Size */}
            <AutocompleteSelect
              label={t("field.engineSize")}
              options={fieldOptions.engine_size}
              value={form.engine_size}
              onChange={(opt) => updateForm("engine_size", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.engineSize") })}
            />
          </div>
        </div>

        {/* 3. Features & Options Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.features")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MultiSelectAutocomplete
              label={t("field.reasonsToBuy")}
              options={fieldOptions.reasons_to_buy}
              values={form.reasons_to_buy}
              onChange={(vals) => updateForm("reasons_to_buy", vals as string[])}
              placeholder={t("placeholder.select", { field: t("field.reasonsToBuy") })}
            />

            <MultiSelectAutocomplete
              label={t("field.safetyFeatures")}
              options={fieldOptions.safety_features}
              values={form.safety_features}
              onChange={(vals) => updateForm("safety_features", vals)}
              placeholder={t("placeholder.select", { field: t("field.safetyFeatures") })}
            />

            <MultiSelectAutocomplete
              label={t("field.comfortFeatures")}
              options={fieldOptions.comfort_features}
              values={form.comfort_features}
              onChange={(vals) => updateForm("comfort_features", vals)}
              placeholder={t("placeholder.select", { field: t("field.comfortFeatures") })}
            />

            <AutocompleteSelect
              label={t("field.imageTags")}
              options={fieldOptions.image_tags}
              value={form.image_tags}
              onChange={(opt) => updateForm("image_tags", opt ? (opt.termId ?? opt.value) : "")}
              placeholder={t("placeholder.select", { field: t("field.imageTags") })}
            />
          </div>
        </div>

        {/* 4. Multilingual Description Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.multilingualDesc")}</h2>
          </div>

          <div className="space-y-4">
            {/* Language Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              {(["thai", "english", "chinese"] as const).map((lang) => {
                const labels: Record<string, string> = {
                  thai: "Thai (ภาษาไทย)",
                  english: "English",
                  chinese: "Chinese (中文)",
                };
                const isActive = activeDescTab === lang;
                const hasText = Boolean(descriptions[lang].trim());
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveDescTab(lang)}
                    className={`px-4 py-2.5 text-xs font-bold transition border-b-2 relative -mb-px flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "border-[#1B2935] text-[#1B2935]"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span>{labels[lang]}</span>
                    {hasText && <span className="w-1.5 h-1.5 rounded-full bg-[#1B2935]" />}
                  </button>
                );
              })}
            </div>

            {/* Description Textarea */}
            <div>
              <textarea
                rows={6}
                value={descriptions[activeDescTab]}
                onChange={(e) =>
                  setDescriptions((prev) => ({ ...prev, [activeDescTab]: e.target.value }))
                }
                placeholder={t("placeholder.enter", { field: t("form.section.multilingualDesc") })}
                className="w-full p-4 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935] font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 5. Media Gallery Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.media")}</h2>
          </div>

          <ImageUploader images={images} onChange={setImages} maxSizeMb={10} />
        </div>

        {/* 6. Location & Contact Information Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
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
                onChange={(e) => updateForm("address", e.target.value)}
                placeholder="e.g. 1195 Phahonyothin Rd, Phaya Thai, Bangkok 10400"
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
                  onChange={(e) => updateForm("lat", e.target.value)}
                  placeholder="e.g. 13.7742309"
                  className={`w-full px-3.5 py-2.5 bg-[#F7F8FA] border rounded-xl text-xs font-medium outline-none transition ${
                    errors.lat ? "border-rose-400" : "border-[#E6E8EC] focus:border-[#1B2935]"
                  }`}
                />
                {errors.lat && <p className="text-[11px] font-medium text-rose-500">{errors.lat}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1B2935]">{t("field.longitude")}</label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.lng}
                  onChange={(e) => updateForm("lng", e.target.value)}
                  placeholder="e.g. 100.4085338"
                  className={`w-full px-3.5 py-2.5 bg-[#F7F8FA] border rounded-xl text-xs font-medium outline-none transition ${
                    errors.lng ? "border-rose-400" : "border-[#E6E8EC] focus:border-[#1B2935]"
                  }`}
                />
                {errors.lng && <p className="text-[11px] font-medium text-rose-500">{errors.lng}</p>}
              </div>
            </div>

            {/* LINE ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1B2935]">{t("field.lineId")}</label>
              <input
                type="text"
                value={form.line_id}
                onChange={(e) => updateForm("line_id", e.target.value)}
                placeholder="e.g. benzrajchakru"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>
          </div>
        </div>

        {/* 7. Additional Info Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Video className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.additional")}</h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1B2935]">{t("field.youtubeUrl")}</label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => updateForm("video_url", e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/vehicles"
            className="px-5 py-2.5 bg-white border border-[#E6E8EC] hover:bg-slate-50 text-[#1B2935] text-xs font-bold rounded-xl transition cursor-pointer"
          >
            {t("common.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t("modal.creatingListing")}</span>
              </>
            ) : (
              <span>{t("page.createTitle")}</span>
            )}
          </button>
        </div>
      </form>

      {/* Blocking Processing & Status Modal */}
      <FormProcessingModal
        isOpen={modalState !== "idle"}
        mode="create"
        state={modalState}
        errorMessage={modalErrorMessage}
        listingId={createdListingId}
        onCloseError={() => setModalState("idle")}
        onCreateAnother={() => {
          setModalState("idle");
          resetForm();
        }}
        onViewListing={() => {
          setModalState("idle");
          router.push(createdListingId ? `/vehicles/${createdListingId}` : "/vehicles");
        }}
      />
    </div>
  );
}
