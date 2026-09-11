"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { VehicleService, ListingService } from "@/lib/api/services";
import { isFeaturedValue, getTaxonomyLabel, getTaxonomyArrayLabels } from "@/lib/utils";
import { normalizeListingDetails, ListingDetails } from "@/lib/normalizers";
import { SweetModal, SweetModalType } from "@/components/ui/SweetModal";
import { Vehicle } from "@/types";
import { REASONS_TO_BUY_OPTIONS } from "@/config/reasonsToBuy";
import {
  ArrowLeft,
  Car,
  Star,
  Trash2,
  Edit3,
  Send,
  Loader2,
  Calendar,
  Gauge,
  Tag,
  MapPin,
  CheckCircle2,
  Video,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

export default function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const isDealerRoute = pathname.startsWith("/dealer");
  const vehiclesPath = isDealerRoute ? "/dealer/vehicles" : "/vehicles";
  const editPath = (id: string | number) => isDealerRoute ? `/dealer/vehicles/${id}/edit` : `/listings/${id}/edit`;
  
  const { t, listivoLanguage } = useTranslation();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFeatured, setProcessingFeatured] = useState(false);
  const [rawResponseData, setRawResponseData] = useState<any>(null);

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

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawResult: any = await VehicleService.getById(resolvedParams.id, listivoLanguage);
      const details: ListingDetails = normalizeListingDetails(rawResult);
      setRawResponseData(rawResult);

      const normalizedVehicle: Vehicle = {
        listingId: details.listingId || resolvedParams.id,
        title: details.title,
        make: details.make?.name || "N/A",
        model: details.model?.name || "N/A",
        price: details.price,
        formattedPrice: details.formattedPrice,
        oldPrice: undefined,
        dealerPrice: details.dealerPrice,
        status: (details.status || "published") as any,
        publishedDate: details.publishedDate,
        imageUrl: details.images[0]?.url || "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80",
        featured: details.featured,
        featuredExpire: details.featuredExpire,
        referenceCode: details.referenceCode,
        year: details.year,
        mileage: details.mileage,
        modelSpecific: details.modelSpecific,
        bodyStyle: details.bodyStyle?.name,
        fuelType: details.fuelType?.name,
        transmission: details.transmission?.name,
        drivetrain: details.drivetrain?.name,
        color: details.color?.name,
        engineSize: details.engineSize?.name,
        doorCount: details.doorCount?.name,
        safetyFeatures: details.safetyFeatures.map((f) => f.name),
        comfortFeatures: details.comfortFeatures.map((f) => f.name),
        imageTags: details.imageTags.map((f) => f.name),
        address: details.address,
        lat: details.lat,
        lng: details.lng,
        lineId: details.lineId,
        videoUrl: details.videoUrl,
        description: details.description,
        descriptions: details.descriptions,
        images: details.images,
        views: details.views,
      };

      setVehicle(normalizedVehicle);
      setActiveImage(normalizedVehicle.imageUrl);
    } catch (err: any) {
      console.error("Failed to load vehicle details:", err);
      setError(err?.message || "Failed to load vehicle listing details.");
    } finally {
      setLoading(false);
    }
  };

  const [isBenz, setIsBenz] = useState(false);

  useEffect(() => {
    fetchDetails();
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.tenant?.name?.toLowerCase().includes("benz")) {
          setIsBenz(true);
        }
      })
      .catch(() => {});
  }, [resolvedParams.id, listivoLanguage]);

  const handleToggleFeatured = async () => {
    if (!vehicle) return;
    const isCurrentlyFeatured = isFeaturedValue(vehicle.featured);
    const newFeaturedVal = isCurrentlyFeatured ? "0" : "1";

    setProcessingFeatured(true);
    try {
      await ListingService.updateListing(vehicle.listingId, {
        featured: newFeaturedVal,
      });

      setVehicle((prev) =>
        prev
          ? {
              ...prev,
              featured: newFeaturedVal === "1",
            }
          : null
      );

      setSweetModal({
        isOpen: true,
        type: "success",
        title: t("listing.status.featured"),
        message: `Listing #${vehicle.listingId} is now ${
          newFeaturedVal === "1" ? t("listing.status.featured") : t("listing.status.unfeatured")
        }.`,
      });
    } catch (err: any) {
      console.error("Failed to update featured:", err);
      setSweetModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: err?.message || "Failed to update featured status.",
      });
    } finally {
      setProcessingFeatured(false);
    }
  };

  const handleTrash = () => {
    if (!vehicle) return;
    setSweetModal({
      isOpen: true,
      type: "warning",
      title: t("common.moveListingToTrash"),
      message: t("common.confirmMoveToTrash", { id: vehicle.listingId, title: vehicle.title }),
      onConfirm: async () => {
        try {
          await ListingService.trashListing(vehicle.listingId);
          setSweetModal({
            isOpen: true,
            type: "success",
            title: t("common.listingTrashed"),
            message: t("common.listingTrashedSuccess", { id: vehicle.listingId }),
            onConfirm: () => router.push(vehiclesPath),
          });
        } catch (err: any) {
          console.error("Failed to trash listing:", err);
          setSweetModal({
            isOpen: true,
            type: "error",
            title: t("common.trashFailed"),
            message: err?.message || "Failed to move listing to trash.",
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48" />
        <div className="h-48 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl md:col-span-2" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#1B2935]">{t("detail.errorTitle")}</h2>
        <p className="text-xs text-[#6B7280]">{error || t("detail.notFound")}</p>
        <Link
          href={vehiclesPath}
          className="px-4 py-2 bg-[#FF9540] hover:bg-[#FF8420] text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("form.backToVehicles")}</span>
        </Link>
      </div>
    );
  }

  const isFeatured = vehicle ? isFeaturedValue(vehicle.featured) : false;

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={vehiclesPath}
            className="p-2 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title={t("form.backToVehicles")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#1B2935] text-white font-mono text-[10px] font-bold">
                {t("common.id")} #{vehicle.listingId}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px]">
                {String(vehicle.status || "").toLowerCase() === "publish" || String(vehicle.status || "").toLowerCase() === "published"
                  ? t("listing.status.published")
                  : String(vehicle.status || "").toLowerCase() === "draft"
                  ? t("listing.status.draft")
                  : String(vehicle.status || "").toLowerCase() === "pending"
                  ? t("listing.status.pending")
                  : vehicle.status}
              </span>
              {isFeatured && (
                <span className="px-2 py-0.5 rounded-md bg-[#FF9540] text-white font-bold text-[10px] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {t("listing.status.featured")}
                </span>
              )}
            </div>
            <h1 className="text-base md:text-lg font-bold text-[#1B2935] mt-1">
              {vehicle.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Featured */}
          <button
            type="button"
            disabled={processingFeatured}
            onClick={handleToggleFeatured}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
              isFeatured
                ? "bg-orange-50 border-orange-200 text-[#FF9540] hover:bg-orange-100"
                : "bg-[#F7F8FA] border-[#E6E8EC] text-slate-700 hover:bg-slate-100"
            }`}
          >
            {processingFeatured ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-current" : ""}`} />
            )}
            <span>{isFeatured ? t("listing.status.removeFeatured") : t("listing.status.markAsFeatured")}</span>
          </button>

          {/* Edit Button */}
          <Link
            href={editPath(vehicle.listingId)}
            className="px-3.5 py-2 bg-[#F7F8FA] hover:bg-slate-100 border border-[#E6E8EC] text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            title={t("page.editTitle")}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t("common.edit")}</span>
          </Link>

          {/* Trash Button */}
          <button
            type="button"
            onClick={handleTrash}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("common.trash")}</span>
          </button>
        </div>
      </div>

      {/* Main Hero Image Container - Full Natural Aspect Ratio Uncropped (White Background) */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-sm overflow-hidden space-y-4">
        <div className="relative w-full bg-white flex items-center justify-center min-h-[340px] max-h-[600px] p-2 sm:p-4">
          <div className="rounded-3xl overflow-hidden flex items-center justify-center max-h-[560px] shadow-sm">
            <img
              src={activeImage || vehicle.imageUrl}
              alt={vehicle.title}
              className="w-full h-auto max-h-[560px] object-contain rounded-3xl"
            />
          </div>
        </div>

        {/* Gallery Previews if available */}
        {vehicle.images && vehicle.images.length > 0 && (
          <div className="p-4 pt-0 space-y-2">
            <h3 className="text-xs font-bold text-[#1B2935]">
              {t("common.uploadedImages", { count: vehicle.images.length })}
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {vehicle.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(img.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border ${activeImage === img.url ? 'border-[#FF9540] ring-2 ring-[#FF9540]/20' : 'border-slate-200'} bg-slate-50 hover:opacity-90 transition cursor-pointer`}
                >
                  <img
                    src={img.url}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {img.attachment_id && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white font-mono text-[9px] px-1 rounded">
                      #{img.attachment_id}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price & Summary Card (Below Images) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">
              {t("field.priceThb")}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-bold ${isBenz ? "text-[#0078d6]" : "text-[#FF9540]"}`}>
                {vehicle.formattedPrice}
              </span>
              {vehicle.oldPrice && (
                <span className="text-xs text-[#6B7280] line-through">
                  ฿{vehicle.oldPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
            <span className="text-[#6B7280] block text-[11px]">{t("field.make")}</span>
            <strong className="text-[#1B2935] text-xs">{vehicle.make}</strong>
          </div>
          <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
            <span className="text-[#6B7280] block text-[11px]">{t("field.model")}</span>
            <strong className="text-[#1B2935] text-xs">{vehicle.model}</strong>
          </div>
          {vehicle.year && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.year")}</span>
              <strong className="text-[#1B2935] text-xs">{vehicle.year}</strong>
            </div>
          )}
          {vehicle.mileage !== undefined && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.mileageKm")}</span>
              <strong className="text-[#1B2935] text-xs">
                {Number(vehicle.mileage).toLocaleString()} km
              </strong>
            </div>
          )}
          <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
            <span className="text-[#6B7280] block text-[11px]">{t("common.views")}</span>
            <strong className="text-[#1B2935] text-xs">
              {vehicle.views !== null && vehicle.views !== undefined ? vehicle.views.toLocaleString() : "—"}
            </strong>
          </div>
          {vehicle.referenceCode && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("detail.refCode")}</span>
              <strong className="text-[#1B2935] font-mono text-xs">
                {vehicle.referenceCode}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Specifications & Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Car className="w-4 h-4 text-[#FF9540]" />
          <h2 className="text-sm font-bold text-[#1B2935]">{t("detail.vehicleSpecifications")}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
          {vehicle.bodyStyle && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.bodyType")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.bodyStyle}</span>
            </div>
          )}
          {vehicle.fuelType && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.fuelType")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.fuelType}</span>
            </div>
          )}
          {vehicle.transmission && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.transmission")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.transmission}</span>
            </div>
          )}
          {vehicle.drivetrain && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.drivetrain")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.drivetrain}</span>
            </div>
          )}
          {vehicle.color && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.colour")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.color}</span>
            </div>
          )}
          {vehicle.engineSize && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.engineSize")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.engineSize}</span>
            </div>
          )}
          {vehicle.doorCount && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.doorCount")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.doorCount}</span>
            </div>
          )}
          {vehicle.modelSpecific && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
              <span className="text-[#6B7280] block text-[11px]">{t("field.modelSpecific")}</span>
              <span className="font-bold text-[#1B2935]">{vehicle.modelSpecific}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Description */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#FF9540]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.multilingualDesc")}</h2>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {vehicle.description || t("detail.noDescription")}
          </p>
        </div>

        {/* Location & Contact */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-[#FF9540]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.location")}</h2>
          </div>
          <div className="space-y-2 text-xs">
            {vehicle.address && (
              <div>
                <span className="text-[#6B7280] block text-[11px]">{t("field.address")}</span>
                <span className="font-bold text-[#1B2935]">{vehicle.address}</span>
              </div>
            )}
            {(vehicle.lat || vehicle.lng) && (
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">{t("field.latitude")}</span>
                  <span className="font-bold text-[#1B2935] font-mono">{vehicle.lat}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">{t("field.longitude")}</span>
                  <span className="font-bold text-[#1B2935] font-mono">{vehicle.lng}</span>
                </div>
              </div>
            )}
            {vehicle.lineId && (
              <div>
                <span className="text-[#6B7280] block text-[11px]">{t("field.lineId")}</span>
                <span className="font-bold text-[#1B2935]">{vehicle.lineId}</span>
              </div>
            )}
            {vehicle.videoUrl && (
              <div>
                <span className="text-[#6B7280] block text-[11px]">{t("detail.videoLink")}</span>
                <a
                  href={vehicle.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#FF9540] underline"
                >
                  {vehicle.videoUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features & Taxonomies */}
      {((vehicle.safetyFeatures && vehicle.safetyFeatures.length > 0) ||
        (vehicle.comfortFeatures && vehicle.comfortFeatures.length > 0) ||
        (vehicle.imageTags && vehicle.imageTags.length > 0) ||
        vehicle.reasonsToBuy ||
        vehicle.dealerPrice) && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tag className="w-4 h-4 text-[#FF9540]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("detail.additionalFeatures")}</h2>
          </div>

          <div className="space-y-4 text-xs">
            {vehicle.dealerPrice && (
              <div>
                <span className="text-[#6B7280] block text-[11px]">{t("detail.dealerPrice")}</span>
                <span className="font-bold text-slate-800">฿{Number(vehicle.dealerPrice).toLocaleString()}</span>
              </div>
            )}

            {vehicle.reasonsToBuy && (Array.isArray(vehicle.reasonsToBuy) ? vehicle.reasonsToBuy.length > 0 : Boolean(vehicle.reasonsToBuy)) && (
              <div>
                <span className="text-[#6B7280] block text-[11px] mb-1.5">{t("field.reasonsToBuy")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(vehicle.reasonsToBuy) ? vehicle.reasonsToBuy : [vehicle.reasonsToBuy]).map((val: string, idx: number) => {
                    const canonical = String(val).trim();
                    const found = REASONS_TO_BUY_OPTIONS.find((opt) => opt.value.toLowerCase() === canonical.toLowerCase());
                    const displayLabel = found ? t(found.labelKey) : canonical;
                    return (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200">
                        {displayLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {vehicle.safetyFeatures && vehicle.safetyFeatures.length > 0 && (
              <div>
                <span className="text-[#6B7280] block text-[11px] mb-1.5">{t("field.safetyFeatures")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {vehicle.safetyFeatures.map((feat: any, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200">
                      {typeof feat === "object" ? feat.name || feat.english || feat.thai : String(feat)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {vehicle.comfortFeatures && vehicle.comfortFeatures.length > 0 && (
              <div>
                <span className="text-[#6B7280] block text-[11px] mb-1.5">{t("field.comfortFeatures")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {vehicle.comfortFeatures.map((feat: any, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-orange-50 text-[#FF9540] rounded-lg text-[11px] font-semibold border border-orange-200">
                      {typeof feat === "object" ? feat.name || feat.english || feat.thai : String(feat)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {vehicle.imageTags && vehicle.imageTags.length > 0 && (
              <div>
                <span className="text-[#6B7280] block text-[11px] mb-1.5">{t("field.imageTags")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {vehicle.imageTags.map((tag: any, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-semibold border border-emerald-200">
                      {typeof tag === "object" ? tag.name || tag.english || tag.thai : String(tag)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multilingual Descriptions Section if present */}
      {vehicle.descriptions && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#FF9540]" />
            <h2 className="text-sm font-bold text-[#1B2935]">{t("form.section.multilingualDesc")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {vehicle.descriptions.thai && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-[#FF9540]">{t("lang.thai")}</span>
                <p className="text-slate-700 whitespace-pre-line">{vehicle.descriptions.thai}</p>
              </div>
            )}
            {vehicle.descriptions.english && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-[#FF9540]">{t("lang.english")}</span>
                <p className="text-slate-700 whitespace-pre-line">{vehicle.descriptions.english}</p>
              </div>
            )}
            {vehicle.descriptions.chinese && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-[#FF9540]">{t("lang.chinese")}</span>
                <p className="text-slate-700 whitespace-pre-line">{vehicle.descriptions.chinese}</p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* SweetModal Popup */}
      <SweetModal
        isOpen={sweetModal.isOpen}
        onClose={() => setSweetModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={sweetModal.onConfirm}
        type={sweetModal.type}
        title={sweetModal.title}
        message={sweetModal.message}
        showCancel={true}
        confirmText={t("common.confirm")}
      />
    </div>
  );
}
