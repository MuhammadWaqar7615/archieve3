"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListingService } from "@/lib/api/services";
import { SweetModal, SweetModalType } from "@/components/ui/SweetModal";
import { Vehicle } from "@/types";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, Edit3, Loader2, MoreVertical } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useTenantPath } from "@/lib/useTenantPath";

type SortOption = "default" | "recently-added" | "title-asc" | "title-desc" | "price-asc" | "price-desc" | "mileage-asc" | "mileage-desc" | "year-desc" | "year-asc";

const PER_PAGE = 10;

/* =========================================================
   LISTIVO SOURCE ENDPOINT
   ========================================================= */

// meta.* custom-field keys used by this specific site, taken directly from
// the sample response. If the site's Listivo field configuration changes,
// these IDs are the only thing that needs updating.
const META_FIELD = {
  price: "listivo_130_listivo_13",
  year: "listivo_4316",
  mileage: "listivo_4686",
  trim: "listivo_13698",
  reference: "listivo_8671",
  address: "listivo_153_address",
  lat: "listivo_153_lat",
  lng: "listivo_153_lng",
};

// taxonomies.* keys used by this specific site.
const TAXONOMY_FIELD = {
  make: "listivo_945",
  model: "listivo_946",
  fuelType: "listivo_5667",
  bodyType: "listivo_9312",
  transmission: "listivo_5666",
  color: "listivo_8638",
  engineSize: "listivo_8733",
  badge: "listivo_12624",
};

// Every taxonomy field on a record is an array of { term_id, name } terms.
// This pulls the first term's name, which is what the UI needs to display.
const firstTaxonomyName = (record: any, taxonomyKey: string): string => {
  const terms = record?.taxonomies?.[taxonomyKey];
  return Array.isArray(terms) && terms.length > 0 ? String(terms[0]?.name || "").trim() : "";
};

// The endpoint gives raw numeric strings ("499000"), not a currency string.
// This formats it as Thai Baht for display, matching car.formattedPrice's
// original role in the UI.
const formatThb = (amount: number): string => {
  if (!Number.isFinite(amount) || amount <= 0) return "Price on request";
  return `฿${amount.toLocaleString("en-US")}`;
};

// Converts one raw Listivo API record into the Vehicle shape the rest of
// this page (table, cards, sorting, search) already relies on.
const mapListivoRecordToVehicle = (record: any): Vehicle => {
  const listingId = String(record?.post?.ID ?? "");
  const title = String(record?.post?.post_title ?? "").trim();

  const meta = record?.meta || {};
  const price = Number(meta[META_FIELD.price]) || 0;
  const mileage = Number(meta[META_FIELD.mileage]) || 0;
  const year = Number(meta[META_FIELD.year]) || undefined;

  const make = firstTaxonomyName(record, TAXONOMY_FIELD.make);
  const model = firstTaxonomyName(record, TAXONOMY_FIELD.model);

  const relatedImages = Array.isArray(record?.related_guids) ? record.related_guids : [];
  const imageUrl =
    relatedImages
      .map((img: any) => img?.images?.custom_225x225)
      .find((url: unknown) => typeof url === "string" && url.length > 0) || "";

  const rawViews = record?.meta?.views ?? record?.views;
  const views =
    rawViews !== undefined &&
    rawViews !== null &&
    rawViews !== "" &&
    Number.isFinite(Number(rawViews))
      ? Number(rawViews)
      : null;

  return {
    listingId,
    title,
    make,
    model,
    year,
    mileage,
    price,
    formattedPrice: formatThb(price),
    imageUrl,
    // This endpoint only ever returns published listings, so status is fixed.
    status: "Publish",
    featured: meta.featured === "1" || meta.featured === 1,
    views,
  } as Vehicle;
};

/* =========================================================
   PROFESSIONAL BRAND SORTING
   ========================================================= */

const brandCollator = new Intl.Collator("en", {
  usage: "sort",
  sensitivity: "base",
  numeric: true,
  ignorePunctuation: false,
});

const normalizeValue = (value: unknown): string => {
  return String(value ?? "").replace(/\s+/g, " ").trim();
};

// Brands whose name is more than one word. Checked against the start of the
// title (after the year is stripped) so e.g. "Mercedes-Benz" or "Land Rover"
// aren't cut down to just "Mercedes" or "Land" by a naive first-word split.
const MULTI_WORD_BRANDS = [
  "Mercedes-Benz",
  "Land Rover",
  "Range Rover",
  "Aston Martin",
  "Alfa Romeo",
  "Rolls-Royce",
  "Great Wall",
];

// Extracts the brand name for sorting/filtering. car.make now comes
// straight from the listing's brand taxonomy (reliable), so it's used
// first; the title-parsing fallback only kicks in if make is missing.
const getCarBrand = (car: Vehicle): string => {
  const make = normalizeValue(car.make);
  if (make) return make;

  const title = normalizeValue(car.title);
  const titleWithoutYear = title.replace(/^(?:19|20)\d{2}\s+/, "");

  const multiWordMatch = MULTI_WORD_BRANDS.find((brand) =>
    titleWithoutYear.toLowerCase().startsWith(brand.toLowerCase())
  );
  if (multiWordMatch) return multiWordMatch;

  return titleWithoutYear.split(/\s+/)[0] || "";
};

/*
  Brand sorting priority (based purely on car.title's brand, never on year):

  1. Brand — the first word(s) of the title, e.g. "BMW", "Toyota", "Mercedes-Benz"
  2. Full title A-Z — stable tiebreaker so cars from the same brand keep a
     consistent, predictable order regardless of sort direction.
  3. Listing ID — final tiebreak if titles are identical.

  Brand direction:
  A-Z = Audi, BMW, Honda, Mercedes-Benz, Toyota
  Z-A = Toyota, Mercedes-Benz, Honda, BMW, Audi
*/

const compareByBrand = (a: Vehicle, b: Vehicle, direction: 1 | -1): number => {
  const brandA = getCarBrand(a);
  const brandB = getCarBrand(b);

  const brandAEmpty = !brandA;
  const brandBEmpty = !brandB;

  // Listings with no readable brand always sink to the bottom, in either direction.
  if (brandAEmpty && !brandBEmpty) return 1;
  if (!brandAEmpty && brandBEmpty) return -1;

  // 1. BRAND — the only field that flips with the chosen direction.
  const brandCompare = brandCollator.compare(brandA, brandB);
  if (brandCompare !== 0) return brandCompare * direction;

  // 2. Full title, always ascending, so same-brand cars stay in a stable order.
  const titleCompare = brandCollator.compare(normalizeValue(a.title), normalizeValue(b.title));
  if (titleCompare !== 0) return titleCompare;

  // 3. LISTING ID — final stable tiebreak.
  return String(a.listingId).localeCompare(String(b.listingId), "en", { numeric: true, sensitivity: "base" });
};

/* =========================================================
   PRICE SORTING
   ========================================================= */

const getComparablePrice = (car: Vehicle): number => {
  const raw = (car as any).price ?? car.formattedPrice ?? "0";
  const numeric = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

/* =========================================================
   MILEAGE SORTING
   ========================================================= */

const getComparableMileage = (car: Vehicle): number => {
  const numeric = Number(car.mileage);
  return Number.isFinite(numeric) ? numeric : 0;
};

/* =========================================================
   YEAR SORTING
   ========================================================= */

const getComparableYear = (car: Vehicle): number => {
  const numeric = Number(car.year);
  return Number.isFinite(numeric) ? numeric : 0;
};

/* =========================================================
   FEATURED SORTING
   ========================================================= */

const getComparableFeatured = (car: Vehicle): number => {
  return car.featured ? 1 : 0;
};

/* =========================================================
   VEHICLES PAGE
   ========================================================= */

export default function VehiclesPage() {
  const router = useRouter();
  const { t, listivoLanguage } = useTranslation();
  const getPath = useTenantPath();

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [makeFilter, setMakeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [processingFeaturedId, setProcessingFeaturedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [sweetModal, setSweetModal] = useState<{ isOpen: boolean; type: SweetModalType; title: string; message: string; onConfirm?: () => void; }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isBenz, setIsBenz] = useState(false);

  /* =======================================================
     LOAD ALL VEHICLES
     ======================================================= */

  const loadAllVehicles = async (currentLang: string = listivoLanguage) => {
    setLoading(true);

    try {
      const isDealer = typeof window !== "undefined" && window.location.pathname.startsWith("/dealer");
      const url = isDealer ? "/api/dealer/listings" : "/api/admin/listings";
      const res = await fetch(`${url}?per_page=100&lang=${encodeURIComponent(currentLang)}`);
      if (!res.ok) {
        throw new Error(`Failed to load listings (status ${res.status})`);
      }

      const json = await res.json();
      const rawRecords: any[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.results)
        ? json.results
        : [];

      setAllVehicles(rawRecords.map(mapListivoRecordToVehicle));
    } catch (err) {
      console.error("Failed to load vehicles:", err);
      setAllVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadAllVehicles(listivoLanguage);

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.tenant?.name?.toLowerCase().includes("benz")) {
          setIsBenz(true);
        }
      })
      .catch(() => {});
  }, [listivoLanguage]);

  /* =======================================================
     CLOSE ACTION MENU
     ======================================================= */

  useEffect(() => {
    const handleGlobalClick = () => setOpenMenuId(null);

    window.addEventListener("click", handleGlobalClick);

    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  /* =======================================================
     RESET PAGE
     ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, makeFilter, sortBy]);

  /* =======================================================
     SEARCH + FILTER + SORT
     ======================================================= */

  const filteredVehicles = useMemo(() => {
    let data = [...allVehicles];

    // Make filter — matched against the same title-derived brand used for sorting
    if (makeFilter !== "all") {
      data = data.filter((v) => getCarBrand(v).toLowerCase() === makeFilter.toLowerCase());
    }

    // Search
    const query = search.trim().toLowerCase();

    if (query) {
      data = data.filter((v) => {
        return (
          String(v.listingId).toLowerCase().includes(query) ||
          (v.title || "").toLowerCase().includes(query) ||
          (v.make || "").toLowerCase().includes(query) ||
          (v.model || "").toLowerCase().includes(query)
        );
      });
    }

    // Sort
    switch (sortBy) {
      case "recently-added":
        data.sort((a, b) => Number(b.listingId) - Number(a.listingId));
        break;

      case "title-asc":
        data.sort((a, b) => compareByBrand(a, b, 1));
        break;

      case "title-desc":
        data.sort((a, b) => compareByBrand(a, b, -1));
        break;

      case "price-asc":
        data.sort((a, b) => getComparablePrice(a) - getComparablePrice(b));
        break;

      case "price-desc":
        data.sort((a, b) => getComparablePrice(b) - getComparablePrice(a));
        break;

      case "mileage-asc":
        data.sort((a, b) => getComparableMileage(a) - getComparableMileage(b));
        break;

      case "mileage-desc":
        data.sort((a, b) => getComparableMileage(b) - getComparableMileage(a));
        break;

      case "year-desc":
        data.sort((a, b) => getComparableYear(b) - getComparableYear(a));
        break;

      case "year-asc":
        data.sort((a, b) => getComparableYear(a) - getComparableYear(b));
        break;

      case "default":
      default:
        data.sort((a, b) => {
          const featDiff = getComparableFeatured(b) - getComparableFeatured(a);
          if (featDiff !== 0) return featDiff;
          return Number(b.listingId) - Number(a.listingId);
        });
        break;
    }

    return data;
  }, [allVehicles, search, makeFilter, sortBy]);

  /* =======================================================
     PAGINATION
     ======================================================= */

  const pagination = useMemo(() => {
    const totalListings = filteredVehicles.length;
    const totalPages = Math.max(1, Math.ceil(totalListings / PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);

    return { totalListings, totalPages, currentPage: safePage, perPage: PER_PAGE };
  }, [filteredVehicles, currentPage]);

  useEffect(() => {
    if (currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [pagination.totalPages, currentPage]);

  const paginatedVehicles = useMemo(() => {
    const start = (pagination.currentPage - 1) * PER_PAGE;
    return filteredVehicles.slice(start, start + PER_PAGE);
  }, [filteredVehicles, pagination.currentPage]);

  /* =======================================================
     SEARCH SUBMIT
     ======================================================= */

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  /* =======================================================
     FEATURED
     ======================================================= */

  const handleToggleFeatured = async (car: Vehicle) => {
    const isCurrentlyFeatured = Boolean(car.featured);
    const newFeaturedVal = isCurrentlyFeatured ? "0" : "1";

    setProcessingFeaturedId(car.listingId);

    try {
      const res = await ListingService.updateListing(car.listingId, { featured: newFeaturedVal });

      if (res && (res.success === false || (res as any).error)) {
        throw new Error((res as any).error || res.message || "Server update failed.");
      }

      setAllVehicles((prev) =>
        prev.map((item) => item.listingId === car.listingId ? { ...item, featured: newFeaturedVal === "1" } : item)
      );
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

  /* =======================================================
     TRASH
     ======================================================= */

  const handleTrashListing = (car: Vehicle) => {
    setSweetModal({
      isOpen: true,
      type: "warning",
      title: "Move Listing to Trash?",
      message: `Are you sure you want to move Listing #${car.listingId} (${car.title}) to trash? It can be restored later if needed.`,
      onConfirm: async () => {
        try {
          await ListingService.trashListing(car.listingId);

          setAllVehicles((prev) => prev.filter((item) => item.listingId !== car.listingId));

          setSweetModal({
            isOpen: true,
            type: "success",
            title: "Listing Trashed",
            message: `Listing #${car.listingId} was successfully moved to trash.`,
          });
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

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl w-full" />
        <div className="h-12 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-2xl w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ===================================================
          SEARCH / FILTER / SORT
          =================================================== */}

      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />

          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")} className="w-full pl-9 pr-4 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs outline-none focus:border-[#FF9540]" />
        </div>

        <select value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)} className="w-full md:w-44 px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs outline-none">
          <option value="all">{t("common.allMakes")}</option>
          <option value="Honda">Honda</option>
          <option value="Toyota">Toyota</option>
          <option value="Mercedes-Benz">Mercedes-Benz</option>
          <option value="BMW">BMW</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full md:w-52 px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs outline-none" title={t("common.sortBy")}>
          <option value="default">{t("common.defaultSort")}</option>
          <option value="recently-added">{t("common.recentlyAdded")}</option>
          <option value="title-asc">{t("common.brandAZ")}</option>
          <option value="title-desc">{t("common.brandZA")}</option>
          <option value="price-asc">{t("common.priceLowHigh")}</option>
          <option value="price-desc">{t("common.priceHighLow")}</option>
          <option value="mileage-asc">{t("common.mileageLowHigh")}</option>
          <option value="mileage-desc">{t("common.mileageHighLow")}</option>
          <option value="year-desc">{t("common.yearNewest")}</option>
          <option value="year-asc">{t("common.yearOldest")}</option>
        </select>
      </form>

      <div className="space-y-4">

        {/* =================================================
            DESKTOP TABLE
            ================================================= */}

        <div className="hidden lg:block bg-white rounded-2xl border border-[#E6E8EC] shadow-sm overflow-hidden">
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
                {paginatedVehicles.length > 0 ? paginatedVehicles.map((car) => {
                  const isFeatured = car.featured;
                  const isFeaturedLoading = processingFeaturedId === car.listingId;

                  return (
                    <tr key={car.listingId} className="hover:bg-slate-50/80 transition duration-150">

                      <td className="py-3 px-4 align-middle font-mono font-bold text-[#6B7280]">#{car.listingId}</td>

                      <td className="py-3 px-4 text-center align-middle">
                        <img src={car.imageUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='120' height='90' fill='%23F1F5F9'/><path d='M35 52l9-12 7 9 12-16 17 22H35z' fill='%23CBD5E1'/><circle cx='44' cy='36' r='5' fill='%23CBD5E1'/><text x='60' y='72' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2394A3B8' text-anchor='middle'>NO IMAGE</text></svg>"} alt={car.title} onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='120' height='90' fill='%23F1F5F9'/><path d='M35 52l9-12 7 9 12-16 17 22H35z' fill='%23CBD5E1'/><circle cx='44' cy='36' r='5' fill='%23CBD5E1'/><text x='60' y='72' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2394A3B8' text-anchor='middle'>NO IMAGE</text></svg>"; }} className="w-12 h-9 object-cover rounded-lg border border-slate-200 shadow-2xs mx-auto" />
                      </td>

                      <td className="py-3 px-4 align-middle max-w-xs">
                        <Link href={getPath(`/vehicles/${car.listingId}`)} className="font-bold text-[#1B2935] hover:text-[#FF9540] transition line-clamp-2 leading-snug" title={car.title}>{car.title}</Link>
                      </td>

                      <td className={`py-3 px-4 align-middle font-bold ${isBenz ? "text-[#0078d6]" : "text-[#FF9540]"} whitespace-nowrap`}>{car.formattedPrice}</td>

                      <td className="py-3 px-4 align-middle font-medium text-[#1B2935] whitespace-nowrap">
                        {car.mileage !== undefined && car.mileage !== "" ? `${Number(car.mileage).toLocaleString()} km` : "—"}
                      </td>

                      <td className="py-3 px-4 align-middle font-medium text-[#1B2935] whitespace-nowrap">
                        {car.views !== null && car.views !== undefined ? car.views.toLocaleString("en-US") : "—"}
                      </td>

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

                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button type="button" disabled={isFeaturedLoading} onClick={(e) => { e.stopPropagation(); handleToggleFeatured(car); }} className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 ease-in-out cursor-pointer ${isFeatured ? "bg-[#FF9540]" : "bg-slate-300"}`} title={isFeatured ? t("listing.status.removeFeatured") : t("listing.status.markAsFeatured")}>
                            <span style={{ transform: isFeatured ? "translateX(16px)" : "translateX(2px)" }} className="inline-block w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm" />
                          </button>

                          {isFeaturedLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF9540]" /> : isFeatured ? <span className="text-[11px] font-bold text-[#FF9540]">{t("listing.status.featured")}</span> : <span className="text-[11px] font-medium text-slate-400">{t("listing.status.unfeatured")}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setOpenMenuId((prev) => prev === car.listingId ? null : car.listingId); }} className="p-1.5 rounded-lg border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 text-slate-600 transition cursor-pointer" title="Actions Menu">
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === car.listingId && (
                            <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-[#E6E8EC] shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100 text-left">
                              <Link href={getPath(`/vehicles/${car.listingId}`)} onClick={() => setOpenMenuId(null)} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-[#1B2935] font-semibold transition">
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Details</span>
                              </Link>

                              <Link href={getPath(`/listings/${car.listingId}/edit`)} onClick={() => setOpenMenuId(null)} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-[#1B2935] font-semibold transition">
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit Listing</span>
                              </Link>

                              <div className="border-t border-slate-100 my-1" />

                              <button type="button" onClick={() => { setOpenMenuId(null); handleTrashListing(car); }} className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 text-rose-600 font-semibold transition cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Move to Trash</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">No vehicles found matching search parameters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================================
            MOBILE / TABLET
            ================================================= */}

        <div className="block lg:hidden space-y-3">
          {paginatedVehicles.length > 0 ? paginatedVehicles.map((car) => {
            const isFeatured = car.featured;
            const isFeaturedLoading = processingFeaturedId === car.listingId;

            return (
              <div key={car.listingId} className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-3">

                <div className="flex items-start gap-3">
                  <img src={car.imageUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='120' height='90' fill='%23F1F5F9'/><path d='M35 52l9-12 7 9 12-16 17 22H35z' fill='%23CBD5E1'/><circle cx='44' cy='36' r='5' fill='%23CBD5E1'/><text x='60' y='72' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2394A3B8' text-anchor='middle'>NO IMAGE</text></svg>"} alt={car.title} onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='120' height='90' fill='%23F1F5F9'/><path d='M35 52l9-12 7 9 12-16 17 22H35z' fill='%23CBD5E1'/><circle cx='44' cy='36' r='5' fill='%23CBD5E1'/><text x='60' y='72' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2394A3B8' text-anchor='middle'>NO IMAGE</text></svg>"; }} className="w-16 h-12 object-cover rounded-xl border border-slate-200 shrink-0" />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">#{car.listingId}</span>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {car.status?.toLowerCase() === "publish" || car.status?.toLowerCase() === "published"
                          ? t("listing.status.published")
                          : car.status?.toLowerCase() === "draft"
                          ? t("listing.status.draft")
                          : car.status?.toLowerCase() === "pending"
                          ? t("listing.status.pending")
                          : car.status}
                      </span>
                    </div>

                    <Link href={`/vehicles/${car.listingId}`} className="font-bold text-[#1B2935] text-xs leading-snug line-clamp-2 block hover:text-[#FF9540]">{car.title}</Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">

                  <div>
                    <span className="text-[11px] text-[#6B7280] block">{t("field.make")} / {t("field.model")}</span>
                    <strong className="text-[#1B2935] text-xs">{car.make} / {car.model}</strong>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#6B7280] block">{t("common.price")}</span>
                    <strong className={`${isBenz ? "text-[#0078d6]" : "text-[#FF9540]"} text-xs`}>{car.formattedPrice}</strong>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#6B7280] block">{t("common.year")}</span>
                    <strong className="text-[#1B2935] text-xs">{car.year || "—"}</strong>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#6B7280] block">{t("common.views")}</span>
                    <strong className="text-[#1B2935] text-xs">
                      {car.views !== null && car.views !== undefined ? car.views.toLocaleString("en-US") : "—"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#6B7280] block">{t("common.featured")}</span>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button type="button" disabled={isFeaturedLoading} onClick={(e) => { e.stopPropagation(); handleToggleFeatured(car); }} className={`relative inline-flex items-center h-4 rounded-full w-7 transition-colors duration-200 ease-in-out cursor-pointer ${isFeatured ? "bg-[#FF9540]" : "bg-slate-300"}`}>
                        <span style={{ transform: isFeatured ? "translateX(12px)" : "translateX(2px)" }} className="inline-block w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm" />
                      </button>

                      <span className="text-[11px] font-bold text-[#1B2935]">{isFeatured ? t("listing.status.featured") : t("listing.status.unfeatured")}</span>
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Actions</span>

                  <div className="relative inline-block text-left">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setOpenMenuId((prev) => prev === car.listingId ? null : car.listingId); }} className="px-2.5 py-1 rounded-lg border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer">
                      <MoreVertical className="w-3.5 h-3.5" />
                      <span>Options</span>
                    </button>

                    {openMenuId === car.listingId && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-[#E6E8EC] shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100 text-left">
                        <Link href={`/vehicles/${car.listingId}`} onClick={() => setOpenMenuId(null)} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-[#1B2935] font-semibold transition">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Details</span>
                        </Link>

                        <Link href={`/listings/${car.listingId}/edit`} onClick={() => setOpenMenuId(null)} className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-[#1B2935] font-semibold transition">
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Listing</span>
                        </Link>

                        <div className="border-t border-slate-100 my-1" />

                        <button type="button" onClick={() => { setOpenMenuId(null); handleTrashListing(car); }} className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 text-rose-600 font-semibold transition cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Move to Trash</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          }) : (
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8EC] text-center text-slate-500 text-xs">No vehicles found.</div>
          )}
        </div>

        {/* =================================================
            PAGINATION
            ================================================= */}

        <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">

          <div>
            Showing <strong className="text-[#1B2935]">{pagination.totalListings === 0 ? 0 : (pagination.currentPage - 1) * pagination.perPage + 1}</strong>–<strong className="text-[#1B2935]">{Math.min(pagination.currentPage * pagination.perPage, pagination.totalListings)}</strong> of <strong className="text-[#1B2935]">{pagination.totalListings}</strong> listings
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">

            <button disabled={pagination.currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[#1B2935] flex items-center gap-1 cursor-pointer transition">
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-xl border font-bold text-xs flex items-center justify-center transition cursor-pointer ${p === pagination.currentPage ? "bg-[#FF9540] border-[#FF9540] text-white shadow-xs" : "bg-[#F7F8FA] border-[#E6E8EC] text-[#1B2935] hover:bg-slate-100"}`}>
                {p}
              </button>
            ))}

            <button disabled={pagination.currentPage >= pagination.totalPages} onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))} className="px-3 py-1.5 rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[#1B2935] flex items-center gap-1 cursor-pointer transition">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>

      </div>

      {/* ===================================================
          SWEET MODAL
          =================================================== */}

      <SweetModal isOpen={sweetModal.isOpen} onClose={() => setSweetModal((prev) => ({ ...prev, isOpen: false }))} onConfirm={sweetModal.onConfirm} type={sweetModal.type} title={sweetModal.title} message={sweetModal.message} showCancel={true} confirmText="Proceed" />

    </div>
  );
}
