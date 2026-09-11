"use client";

import React, { useState, useEffect, useMemo, useRef, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { VehicleService, ListingService } from "@/lib/api/services";
import { normalizeListingDetails, ListingDetails, parseReasonsToBuy } from "@/lib/normalizers";
import { AutocompleteSelect, OptionItem } from "@/components/ui/AutocompleteSelect";
import { MultiSelectAutocomplete } from "@/components/ui/MultiSelectAutocomplete";
import { FormProcessingModal, ProcessingModalState } from "@/components/ui/FormProcessingModal";
import { useTranslation } from "@/i18n/useTranslation";
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
  ArrowLeft,
  Trash2,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  AlertCircle,
  Save,
  Upload,
  UploadCloud,
  Star,
  Calendar,
  Settings,
} from "lucide-react";

interface ExistingImageItem {
  attachment_id: number;
  url: string;
}

import { REASONS_TO_BUY_OPTIONS } from "@/config/reasonsToBuy";

interface NewImageItem {
  file: File;
  previewUrl: string;
}

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

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;
  const router = useRouter();
  const pathname = usePathname();
  const isDealerRoute = pathname.startsWith("/dealer");
  const vehiclesPath = isDealerRoute ? "/dealer/vehicles" : "/vehicles";
  const vehicleDetailPath = (id: string | number) => isDealerRoute ? `/dealer/vehicles/${id}` : `/vehicles/${id}`;
  const { t, listivoLanguage } = useTranslation();

  // Loading & Dataset state
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingDataset, setLoadingDataset] = useState(true);
  const loading = loadingListing || loadingDataset;
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<any>(null);

  // Normalization Option Lists
  const [makesList, setMakesList] = useState<OptionItem[]>([]);

  const [fieldOptions, setFieldOptions] = useState<{
    body_style: OptionItem[];
    vehicle_type: OptionItem[];
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
    vehicle_type: [],
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
    title: "",
    reference_code: "",
    price: "",
    dealer_price: "",
    year: "",
    mileage: "",
    model_specific: "",
    drive: "",

    make: "" as string | number,
    model: "" as string | number,
    body_style: "" as string | number,
    vehicle_type: "" as string | number,
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
    featured: "0" as string | number,

    expire: "",
    featured_expire: "",
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

  // Existing & New Gallery Images state
  const [existingImages, setExistingImages] = useState<ExistingImageItem[]>([]);
  const [newImages, setNewImages] = useState<NewImageItem[]>([]);

  // Drag & drop and validation state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Image upload validation constants
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFiles = (incomingFiles: FileList | File[]) => {
    setUploadError(null);
    const filesArray = Array.from(incomingFiles);
    const validNewItems: NewImageItem[] = [];
    const errorMessages: string[] = [];

    for (const file of filesArray) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        errorMessages.push(`Invalid file format: ${file.name}. Only JPG, PNG, WEBP are supported.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errorMessages.push(`File too large: ${file.name} exceeds 10MB.`);
        continue;
      }

      validNewItems.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (errorMessages.length > 0) {
      setUploadError(errorMessages.join(" "));
    }

    if (validNewItems.length > 0) {
      setNewImages((prev) => [...prev, ...validNewItems]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const moveNewImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    const newArr = [...newImages];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);
    setNewImages(newArr);
  };

  // Validation errors & submitting state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Blocking Processing Modal State
  const [modalState, setModalState] = useState<ProcessingModalState>("idle");
  const [modalErrorMessage, setModalErrorMessage] = useState("");

  // Helper to generate dynamic title: {Year} {Make} {Model} {Model Specific} using display names
  const getGeneratedTitle = (
    yearVal: string,
    makeVal: string | number,
    modelVal: string | number,
    modelSpecificVal: string
  ): string => {
    let makeLabel = "";
    if (makeVal) {
      const foundMake = makesList.find(
        (m: OptionItem) => String(m.value) === String(makeVal) || String(m.termId ?? "") === String(makeVal)
      );
      makeLabel = foundMake ? foundMake.label : String(makeVal).trim();
    }

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

  // 1. Load Existing Listing (Runs ONCE per listingId)
  const loadExistingListing = async () => {
    setLoadingListing(true);
    setError(null);
    try {
      const rawDetails = await VehicleService.getById(listingId, listivoLanguage);
      const detailsData: ListingDetails = normalizeListingDetails(rawDetails);

      const makeId = detailsData.make?.id ? String(detailsData.make.id) : "";
      const modelId = detailsData.model?.id ? String(detailsData.model.id) : "";

      setForm({
        title: detailsData.title || "",
        reference_code: detailsData.referenceCode || "",
        price: detailsData.price ? String(detailsData.price) : "",
        dealer_price: detailsData.dealerPrice ? String(detailsData.dealerPrice) : "",
        mileage: detailsData.mileage !== undefined ? String(detailsData.mileage) : "",
        year: detailsData.year ? String(detailsData.year) : "",
        model_specific: detailsData.modelSpecific || "",
        reasons_to_buy: parseReasonsToBuy(detailsData.reasonsToBuy),
        drive: detailsData.drive || "",

        make: makeId,
        model: modelId,
        body_style: detailsData.bodyStyle?.id ? String(detailsData.bodyStyle.id) : "",
        vehicle_type: detailsData.vehicleType?.id ? String(detailsData.vehicleType.id) : "",
        door_count: detailsData.doorCount?.id ? String(detailsData.doorCount.id) : "",
        color: detailsData.color?.id ? String(detailsData.color.id) : "",
        fuel_type: detailsData.fuelType?.id ? String(detailsData.fuelType.id) : "",
        transmission: detailsData.transmission?.id ? String(detailsData.transmission.id) : "",
        drivetrain: detailsData.drivetrain?.id ? String(detailsData.drivetrain.id) : "",
        engine_size: detailsData.engineSize?.id ? String(detailsData.engineSize.id) : "",

        safety_features: (detailsData.safetyFeatures || []).map((f) => String(f.id)),
        comfort_features: (detailsData.comfortFeatures || []).map((f) => String(f.id)),
        image_tags: detailsData.imageTags && detailsData.imageTags.length > 0 ? String(detailsData.imageTags[0].id) : "",

        address: detailsData.address || "",
        lat: detailsData.lat !== undefined ? String(detailsData.lat) : "",
        lng: detailsData.lng !== undefined ? String(detailsData.lng) : "",

        line_id: detailsData.lineId || "",
        video_url: detailsData.videoUrl || "",
        featured: (detailsData.rawFeatured === "1" || detailsData.featured) ? "1" : "0",

        expire: detailsData.expire || "",
        featured_expire: detailsData.featuredExpire || "",
      });

      setDescriptions({
        thai: detailsData.descriptions.thai || detailsData.description || "",
        english: detailsData.descriptions.english || "",
        chinese: detailsData.descriptions.chinese || "",
      });

      const galleryImages: ExistingImageItem[] = detailsData.images.map((img) => ({
        attachment_id: Number(img.attachment_id || (img as any).id || 0),
        url: img.url,
      }));
      setExistingImages(galleryImages);

    } catch (err: any) {
      console.error("Failed to load listing for edit:", err);
      setError(err?.message || "Failed to load vehicle listing details.");
    } finally {
      setLoadingListing(false);
    }
  };

  // 2. Load Language-Aware Dataset (Refetches whenever portal language changes)
  const loadDataset = async (lang: string) => {
    setLoadingDataset(true);
    try {
      const datasetData = await ListingService.getDataset(lang);
      setDataset(datasetData);

      const makes: OptionItem[] = Object.entries(datasetData.makes_models || {}).map(
        ([makeName, makeData]: any) => ({
          label: makeName,
          value: String(makeData.term_id),
          termId: makeData.term_id,
        })
      );
      setMakesList(makes);

      const fields = datasetData.fields || {};
      const normFieldOptions = {
        body_style: normalizeTaxonomyList(fields.body_style || []),
        vehicle_type: normalizeTaxonomyList(fields.vehicle_type || []),
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
      };
      setFieldOptions(normFieldOptions);
    } catch (err) {
      console.warn("Failed to load dataset on language change:", err);
    } finally {
      setLoadingDataset(false);
    }
  };

  const loadData = () => {
    loadExistingListing();
    loadDataset(listivoLanguage);
  };

  useEffect(() => {
    loadExistingListing();
  }, [listingId]);

  useEffect(() => {
    loadDataset(listivoLanguage);
  }, [listivoLanguage]);

  useEffect(() => {
    setFieldOptions((prev) => ({
      ...prev,
      reasons_to_buy: getReasonsToBuyOptions(t),
    }));
  }, [t]);

  // Make Selection Change Handler
  const handleMakeChange = (selectedMakeOpt: OptionItem | null) => {
    const newMakeId = selectedMakeOpt
      ? String(selectedMakeOpt.termId ?? selectedMakeOpt.value)
      : "";

    setForm((prev) => ({ ...prev, make: newMakeId, model: "" }));
    setErrors((prev) => ({ ...prev, make: "", model: "" }));
  };

  // Form Field Update Helper
  const updateForm = (field: string, value: any) => {
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
      newErrors.title = "Listing title could not be generated. Please select Year, Make, and Model.";
    }
    if (!form.make) newErrors.make = "Please select a Make";
    if (!form.model) newErrors.model = "Please select a Model";

    if (!form.year) {
      newErrors.year = "Year is required";
    } else if (isNaN(Number(form.year)) || Number(form.year) < 1900 || Number(form.year) > 2030) {
      newErrors.year = "Enter a valid 4-digit year";
    }

    if (!form.price) {
      newErrors.price = "Price is required";
    } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      newErrors.price = "Price must be a valid non-negative number";
    }

    if (form.mileage === "") {
      newErrors.mileage = "Mileage is required";
    } else if (isNaN(Number(form.mileage)) || Number(form.mileage) < 0) {
      newErrors.mileage = "Mileage must be a non-negative number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Move or Remove existing images
  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveExistingImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= existingImages.length) return;
    const newArr = [...existingImages];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);
    setExistingImages(newArr);
  };

  // Submit Update Handler
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
      formData.append("featured", String(form.featured) === "1" ? "1" : "0");
      formData.append("reference_code", form.reference_code.trim());

      if (form.price !== "") formData.append("price", String(form.price));
      if (form.dealer_price !== "") formData.append("dealer_price", String(form.dealer_price));
      if (form.year !== "") formData.append("year", String(form.year));
      if (form.mileage !== "") formData.append("mileage", String(form.mileage));

      formData.append("model_specific", form.model_specific.trim());
      formData.append("reasons_to_buy", JSON.stringify(form.reasons_to_buy));
      formData.append("address", form.address.trim());

      if (form.lat !== "") formData.append("lat", String(form.lat).trim());
      if (form.lng !== "") formData.append("lng", String(form.lng).trim());

      formData.append("line_id", form.line_id.trim());
      if (form.drive) formData.append("drive", form.drive.trim());
      if (form.expire) formData.append("expire", form.expire.trim());
      if (form.featured_expire) formData.append("featured_expire", form.featured_expire.trim());

      formData.append("descriptions", JSON.stringify(descriptions));
      formData.append("video", JSON.stringify({ url: form.video_url.trim(), embed: "" }));

      if (form.make !== "") formData.append("make", String(form.make));
      if (form.model !== "") formData.append("model", String(form.model));
      if (form.body_style !== "") formData.append("body_style", String(form.body_style));
      if (form.vehicle_type !== "") formData.append("vehicle_type", String(form.vehicle_type));
      if (form.fuel_type !== "") formData.append("fuel_type", String(form.fuel_type));
      if (form.transmission !== "") formData.append("transmission", String(form.transmission));
      if (form.drivetrain !== "") formData.append("drivetrain", String(form.drivetrain));
      if (form.color !== "") formData.append("color", String(form.color));
      if (form.engine_size !== "") formData.append("engine_size", String(form.engine_size));
      if (form.door_count !== "") formData.append("door_count", String(form.door_count));

      formData.append("safety_features", JSON.stringify((form.safety_features || []).map((id) => Number(id) || id)));
      formData.append("comfort_features", JSON.stringify((form.comfort_features || []).map((id) => Number(id) || id)));
      formData.append("image_tags", JSON.stringify(form.image_tags !== "" ? [Number(form.image_tags) || form.image_tags] : []));

      formData.append("existing_image_ids", JSON.stringify(existingImages.map((img) => img.attachment_id)));

      newImages.forEach((imgItem) => {
        formData.append("images[]", imgItem.file);
      });

      await ListingService.updateListing(listingId, formData);

      // Clear new images and revoke preview Object URLs
      newImages.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
      setNewImages([]);

      // Re-fetch details to sync persisted WordPress gallery attachment IDs
      await loadData();

      setModalState("success");
    } catch (err: any) {
      console.error("Update listing error:", err);
      setModalErrorMessage(err?.message || "An unexpected error occurred while updating the listing.");
      setModalState("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-xl w-full" />
        <div className="h-64 bg-slate-200 rounded-xl w-full" />
        <div className="h-64 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#1B2935]">Edit Loading Error</h2>
        <p className="text-xs text-[#6B7280]">{error}</p>
        <Link
          href={vehiclesPath}
          className="px-4 py-2 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vehicles</span>
        </Link>
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
        <div className="flex items-center gap-3">
          <Link
            href={vehicleDetailPath(listingId)}
            className="p-2.5 rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 text-[#1B2935] transition flex items-center justify-center shrink-0"
            title={t("form.backToVehicles")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-0.5">
              <Car className="w-4 h-4 text-[#1B2935]" />
              <span>{t("page.editTitle")} #{listingId}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1B2935] tracking-tight">
              {liveTitlePreview || `${t("page.editTitle")} #${listingId}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={vehicleDetailPath(listingId)}
            className="px-3.5 py-2 bg-white border border-[#E6E8EC] hover:bg-slate-50 text-[#1B2935] text-xs font-bold rounded-xl transition"
          >
            {t("common.cancel")}
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
            <AutocompleteSelect
              label={t("field.make")}
              required
              options={makesList}
              value={form.make}
              onChange={handleMakeChange}
              placeholder={t("placeholder.select", { field: t("field.make") })}
              error={errors.make}
            />

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
            <div className="flex items-center gap-2 border-b border-slate-200">
              {(["thai", "english", "chinese"] as const).map((lang) => {
                const labels: Record<string, string> = {
                  thai: "Thai (ภาษาไทย)",
                  english: "English",
                  chinese: "Chinese (中文)",
                };
                const isActive = activeDescTab === lang;
                const hasText = Boolean(descriptions[lang]?.trim());
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

        {/* 5. Media Gallery Section */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon className="w-4 h-4 text-[#1B2935]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.media")}</h2>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] ${
              isDragging
                ? "border-[#FF9540] bg-orange-50/50"
                : "border-[#E6E8EC] bg-[#F7F8FA] hover:border-[#FF9540] hover:bg-orange-50/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-orange-100/80 flex items-center justify-center text-[#FF9540] mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-bold text-[#1B2935]">
              {t("placeholder.dragDrop")}
            </p>

            <p className="text-xs text-[#6B7280] mt-1">
              {t("placeholder.imageFormats")}
            </p>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Existing Attached Images */}
          {existingImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#1B2935]">
                <span>{t("form.imageUpload.existingImages", { count: existingImages.length })}</span>
                <span className="text-[#6B7280] font-normal text-[11px]">
                  {t("common.primaryThumbnailNotice")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {existingImages.map((img, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <div
                      key={`existing-${img.attachment_id}-${idx}`}
                      className={`relative group rounded-xl overflow-hidden border bg-white shadow-xs transition flex flex-col ${
                        isPrimary ? "border-[#1B2935] ring-2 ring-slate-300" : "border-[#E6E8EC]"
                      }`}
                    >
                      <div className="relative aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={img.url}
                          alt={`Existing image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {isPrimary && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#1B2935] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Star className="w-3 h-3 fill-current" /> {t("common.primary")}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-lg opacity-90 hover:opacity-100 transition cursor-pointer"
                          title={t("common.removeImage")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-1.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[10px] text-slate-500 font-mono pl-1">
                          #{img.attachment_id}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveExistingImage(idx, "left")}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition cursor-pointer"
                            title={t("common.moveLeft")}
                          >
                            <ArrowLeftIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === existingImages.length - 1}
                            onClick={() => moveExistingImage(idx, "right")}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition cursor-pointer"
                            title={t("common.moveRight")}
                          >
                            <ArrowRightIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Newly Selected Local Images */}
          {newImages.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-[#1B2935]">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t("form.imageUpload.newImages", { count: newImages.length })}</span>
                </span>
                <span className="text-slate-400 font-normal text-[11px]">
                  {t("form.imageUpload.appendedNotice")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {newImages.map((imgItem, idx) => {
                  const isPrimary = existingImages.length === 0 && idx === 0;
                  return (
                    <div
                      key={`new-${idx}`}
                      className={`relative group rounded-xl overflow-hidden border bg-slate-50 shadow-xs transition flex flex-col ${
                        isPrimary ? "border-[#1B2935] ring-2 ring-slate-300" : "border-slate-300"
                      }`}
                    >
                      <div className="relative aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={imgItem.previewUrl}
                          alt={`New image upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {isPrimary ? (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#1B2935] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Star className="w-3 h-3 fill-current" /> {t("common.primary")}
                          </span>
                        ) : (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider">
                            {t("form.imageUpload.newBadge")}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-lg opacity-90 hover:opacity-100 transition cursor-pointer"
                          title={t("common.removeImage")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-1.5 bg-slate-100 flex items-center justify-between border-t border-slate-200 text-[10px] text-slate-800 font-medium">
                        <span className="truncate max-w-[90px]">{imgItem.file.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveNewImage(idx, "left")}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition cursor-pointer"
                            title={t("common.moveLeft")}
                          >
                            <ArrowLeftIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === newImages.length - 1}
                            onClick={() => moveNewImage(idx, "right")}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition cursor-pointer"
                            title={t("common.moveRight")}
                          >
                            <ArrowRightIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 6. Location & Contact Section */}
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
                  onChange={(e) => updateForm("lng", e.target.value)}
                  placeholder="e.g. 100.4085338"
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
                onChange={(e) => updateForm("line_id", e.target.value)}
                placeholder="e.g. benzrajchakru"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs font-medium outline-none focus:border-[#1B2935]"
              />
            </div>
          </div>
        </div>

        {/* 7. Additional Information Section */}
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
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href={vehicleDetailPath(listingId)}
            className="px-5 py-3 rounded-xl border border-[#E6E8EC] text-xs font-bold text-[#1B2935] hover:bg-slate-100 transition"
          >
            {t("common.cancel")}
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-[#1B2935] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-60 flex items-center gap-2 cursor-pointer"
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
        mode="edit"
        listingId={listingId}
        errorMessage={modalErrorMessage}
        onCloseError={() => setModalState("idle")}
        onContinueEditing={() => setModalState("idle")}
        onViewListing={() => {
          setModalState("idle");
          router.push(vehicleDetailPath(listingId));
        }}
      />
    </div>
  );
}
