import { isFeaturedValue } from "@/lib/utils";

export interface TaxonomyTerm {
  id: number;
  name: string;
  slug?: string;
}

/**
 * Safe parser for Reasons to Buy (listivo_13700).
 * Handles string[], JSON array string, comma-separated string, or single string.
 */
export function parseReasonsToBuy(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    const value = raw.trim();

    if (!value) return [];

    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter(Boolean);
        }
      } catch {
        // continue with normal string parsing
      }
    }

    if (value.includes(",")) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [value];
  }

  return [];
}

export interface ListingDetails {
  listingId: string;
  title: string;
  description: string;
  status: string;
  publishedDate: string;
  modifiedDate: string;
  listingUrl: string;

  featured: boolean;
  rawFeatured: string | number | boolean;
  referenceCode: string;
  price: number;
  formattedPrice: string;
  dealerPrice?: number;
  year?: number;
  mileage?: number;
  modelSpecific: string;
  reasonsToBuy: string[];
  drive?: string;

  make?: TaxonomyTerm;
  model?: TaxonomyTerm;
  bodyStyle?: TaxonomyTerm;
  vehicleType?: TaxonomyTerm;
  fuelType?: TaxonomyTerm;
  transmission?: TaxonomyTerm;
  drivetrain?: TaxonomyTerm;
  color?: TaxonomyTerm;
  engineSize?: TaxonomyTerm;
  doorCount?: TaxonomyTerm;

  safetyFeatures: TaxonomyTerm[];
  comfortFeatures: TaxonomyTerm[];
  imageTags: TaxonomyTerm[];

  address: string;
  lat?: number;
  lng?: number;
  lineId: string;
  videoUrl: string;

  descriptions: {
    thai?: string;
    english?: string;
    chinese?: string;
  };

  images: Array<{
    attachment_id: number;
    url: string;
  }>;

  expire?: string;
  featuredExpire?: string;
  views?: number | null;
  phoneReveals?: number;
  favoriteCount?: number;

  rawPayload: any;
}

function parseSingleTaxonomy(termArray: any): TaxonomyTerm | undefined {
  if (!Array.isArray(termArray) || termArray.length === 0) return undefined;
  const item = termArray[0];
  if (!item) return undefined;
  if (typeof item === "string" || typeof item === "number") {
    return { id: Number(item), name: String(item) };
  }
  return {
    id: Number(item.term_id ?? item.id ?? 0),
    name: item.name ?? item.english ?? item.thai ?? "",
    slug: item.slug,
  };
}

function parseMultiTaxonomy(termArray: any): TaxonomyTerm[] {
  if (!Array.isArray(termArray)) return [];
  return termArray
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return { id: Number(item), name: String(item) };
      }
      return {
        id: Number(item.term_id ?? item.id ?? 0),
        name: item.name ?? item.english ?? item.thai ?? "",
        slug: item.slug,
      };
    })
    .filter((term) => term.name !== "" || term.id !== 0);
}

/**
 * Helper to normalize meta.listivo_145 into an array of numeric/string IDs.
 * Handles array, string ("51963,51964"), or single number/string.
 */
export function parseGalleryIds(raw: any): (string | number)[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    if (raw.includes(",")) {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (/^\d+$/.test(raw.trim())) {
      return [raw.trim()];
    }
  }
  if (typeof raw === "number") return [raw];
  return [];
}

/**
 * Single source of truth for listing gallery resolution.
 * Takes raw listing item from Listivo REST API or normalized object,
 * maps meta.listivo_145 against related_guids, preserving listivo_145 order.
 * Falls back to related_guids or root.images if listivo_145 is empty/unmapped.
 */
export function normalizeListingGallery(rawItem: any): Array<{ attachment_id: number; url: string }> {
  if (!rawItem) return [];

  const root = rawItem?.listing || rawItem?.data || rawItem || {};
  const meta = root?.meta || {};
  const relatedGuids = Array.isArray(root?.related_guids)
    ? root.related_guids
    : Array.isArray(root?.relatedGuids)
    ? root.relatedGuids
    : [];

  const rawGalleryIds = meta?.listivo_145 ?? root?.listivo_145;
  const galleryIds = parseGalleryIds(rawGalleryIds);

  const guidMap = new Map<string, string>();
  relatedGuids.forEach((g: any) => {
    const idKey = String(g.ID ?? g.id ?? g.attachment_id ?? "").trim();
    const urlVal = String(g?.images?.custom_225x225 ?? g?.images?.full ?? g?.guid ?? g?.url ?? "").trim();
    if (idKey && urlVal) {
      guidMap.set(idKey, urlVal);
    }
  });

  // 1. Map meta.listivo_145 against related_guids in exact order
  let images: Array<{ attachment_id: number; url: string }> = galleryIds
    .map((id: any) => {
      const attachmentId = Number(id) || 0;
      const url = guidMap.get(String(id)) || "";
      return {
        attachment_id: attachmentId,
        url: url.trim(),
      };
    })
    .filter((img: { attachment_id: number; url: string }) => img.attachment_id > 0 && img.url !== "");

  // 2. Fallback: map related_guids directly if listivo_145 produced no valid images
  if (images.length === 0 && relatedGuids.length > 0) {
    images = relatedGuids
      .map((g: any) => ({
        attachment_id: Number(g.ID ?? g.id ?? g.attachment_id ?? 0),
        url: String(g?.images?.custom_225x225 ?? g?.images?.full ?? g?.guid ?? g?.url ?? "").trim(),
      }))
      .filter((img: { attachment_id: number; url: string }) => img.url !== "");
  }

  // 3. Fallback: map root.images array if provided
  if (images.length === 0 && Array.isArray(root?.images)) {
    images = root.images
      .map((img: any) => ({
        attachment_id: Number(img.attachment_id ?? img.id ?? 0),
        url: String(img.url || "").trim(),
      }))
      .filter((img: { attachment_id: number; url: string }) => img.url !== "");
  }

  return images;
}

export function normalizeListingDetails(raw: any): ListingDetails {
  const root = raw?.listing || raw?.data || raw || {};
  const post = root?.post || {};
  const meta = root?.meta || {};
  const taxonomies = root?.taxonomies || {};
  const relatedGuids = Array.isArray(root?.related_guids) ? root.related_guids : [];

  // 1. POST FIELDS
  const listingId = String(post?.ID || root?.listingId || root?.id || "");
  const title = root?.title || post?.post_title || root?.post_title || "Untitled Vehicle";
  const description = root?.description || post?.post_content || root?.post_content || "";
  const rawStatus = root?.status || post?.post_status || "Publish";
  const status = (typeof rawStatus === "string" && (rawStatus.toLowerCase() === "publish" || rawStatus.toLowerCase() === "published")) ? "Publish" : rawStatus;
  const publishedDate = root?.publishedDate || post?.post_date || root?.date || "N/A";
  const modifiedDate = root?.modifiedDate || post?.post_modified || "";
  const listingUrl = post?.guid || root?.guid || "";

  // 2. META FIELDS
  const rawFeatured = meta?.featured ?? root?.featured ?? root?.is_featured ?? "0";
  const featured = isFeaturedValue(rawFeatured);

  const referenceCode = meta?.listivo_8671 || root?.referenceCode || root?.reference_code || "";
  const priceVal = meta?.listivo_130_listivo_13 ?? root?.price ?? 0;
  const price = Number(priceVal) || 0;
  const formattedPrice = root?.formattedPrice || (price > 0 ? `฿${price.toLocaleString()}` : "฿0");

  const dealerPriceVal = meta?.listivo_8737_listivo_13 ?? meta?.dealer_price ?? root?.dealerPrice;
  const dealerPrice = dealerPriceVal !== undefined && dealerPriceVal !== "" ? Number(dealerPriceVal) : undefined;

  const yearVal = meta?.listivo_4316 ?? root?.year;
  const year = yearVal !== undefined && yearVal !== "" ? Number(yearVal) : undefined;

  const mileageVal = meta?.listivo_4686 ?? root?.mileage;
  const mileage = mileageVal !== undefined && mileageVal !== "" ? Number(mileageVal) : undefined;

  const modelSpecific = meta?.listivo_13698 || root?.modelSpecific || root?.model_specific || "";
  const rawReasonsToBuy = meta?.listivo_13700 ?? root?.reasonsToBuy ?? root?.reasons_to_buy;
  const reasonsToBuy = parseReasonsToBuy(rawReasonsToBuy);

  const videoUrl = meta?.listivo_345?.url || (typeof root?.videoUrl === "string" ? root.videoUrl : (root?.video?.url || ""));

  const address = meta?.listivo_153_address || root?.address || "";
  const latVal = meta?.listivo_153_lat ?? root?.lat ?? root?.latitude;
  const lat = latVal !== undefined && latVal !== "" ? Number(latVal) : undefined;
  const lngVal = meta?.listivo_153_lng ?? root?.lng ?? root?.longitude;
  const lng = lngVal !== undefined && lngVal !== "" ? Number(lngVal) : undefined;

  const lineId = meta?.listivo_8739 || root?.lineId || root?.line_id || "";
  const drive = meta?.listivo_27936 || root?.drive || "";

  const descriptions = {
    thai: meta?.listivo_26901 || root?.descriptions?.thai || "",
    english: meta?.listivo_26904 || root?.descriptions?.english || "",
    chinese: meta?.listivo_26910 || root?.descriptions?.chinese || "",
  };

  const expire = meta?.expire || root?.expire || "";
  const featuredExpire = meta?.featured_expire || root?.featuredExpire || root?.featured_expire || "";
  const rawViews = meta?.views ?? root?.views;
  const views =
    rawViews !== undefined &&
    rawViews !== null &&
    rawViews !== "" &&
    Number.isFinite(Number(rawViews))
      ? Number(rawViews)
      : null;
  const phoneReveals = meta?.phone_reveals !== undefined ? Number(meta.phone_reveals) : undefined;
  const favoriteCount = meta?.favorite_count !== undefined ? Number(meta.favorite_count) : undefined;

  // 3. TAXONOMY MAPPING
  const make = parseSingleTaxonomy(taxonomies?.listivo_945 ?? root?.make);
  const model = parseSingleTaxonomy(taxonomies?.listivo_946 ?? root?.model);
  const bodyStyle = parseSingleTaxonomy(taxonomies?.listivo_9312 ?? root?.bodyStyle ?? root?.body_style);
  const vehicleType = parseSingleTaxonomy(taxonomies?.listivo_12624 ?? root?.vehicleType);
  const fuelType = parseSingleTaxonomy(taxonomies?.listivo_5667 ?? root?.fuelType ?? root?.fuel_type);
  const transmission = parseSingleTaxonomy(taxonomies?.listivo_5666 ?? root?.transmission);
  const drivetrain = parseSingleTaxonomy(taxonomies?.listivo_8731 ?? root?.drivetrain);
  const color = parseSingleTaxonomy(taxonomies?.listivo_8638 ?? root?.color);
  const engineSize = parseSingleTaxonomy(taxonomies?.listivo_8733 ?? root?.engineSize ?? root?.engine_size);
  const doorCount = parseSingleTaxonomy(taxonomies?.listivo_9311 ?? root?.doorCount ?? root?.door_count);

  const safetyFeatures = parseMultiTaxonomy(taxonomies?.listivo_4318 ?? root?.safetyFeatures ?? root?.safety_features);
  const comfortFeatures = parseMultiTaxonomy(taxonomies?.listivo_8755 ?? root?.comfortFeatures ?? root?.comfort_features);
  const imageTags = parseMultiTaxonomy(taxonomies?.listivo_5664 ?? root?.imageTags ?? root?.image_tags);

  // 4. IMAGES & GALLERY
  const images = normalizeListingGallery(raw);

  return {
    listingId,
    title,
    description,
    status,
    publishedDate,
    modifiedDate,
    listingUrl,

    featured,
    rawFeatured,
    referenceCode,
    price,
    formattedPrice,
    dealerPrice,
    year,
    mileage,
    modelSpecific,
    reasonsToBuy,
    drive,

    make,
    model,
    bodyStyle,
    vehicleType,
    fuelType,
    transmission,
    drivetrain,
    color,
    engineSize,
    doorCount,

    safetyFeatures,
    comfortFeatures,
    imageTags,

    address,
    lat,
    lng,
    lineId,
    videoUrl,

    descriptions,

    images,

    expire,
    featuredExpire,
    views,
    phoneReveals,
    favoriteCount,

    rawPayload: raw,
  };
}
