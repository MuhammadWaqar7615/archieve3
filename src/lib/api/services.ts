import { fetchApi } from "./client";
import { isFeaturedValue, getTaxonomyLabel } from "@/lib/utils";
import { normalizeListingGallery } from "@/lib/normalizers";
import {
  MOCK_STATS,
  MOCK_CHART_DATA,
  MOCK_NOTIFICATIONS,
  MOCK_CAMPAIGNS,
  MOCK_TEMPLATES,
  MOCK_USERS,
  MOCK_VEHICLES,
  MOCK_MAKES,
  MOCK_MODELS,
  MOCK_AUTOMATION,
  MOCK_QUEUE_JOBS,
} from "./mockData";
import {
  DashboardStats,
  ListingStats,
  ChartDataPoint,
  NotificationItem,
  Campaign,
  Template,
  UserItem,
  Vehicle,
  MakeAlert,
  ModelAlert,
  AutomationRule,
  QueueJob,
  UserProfile,
  ProfileImageUploadResponse,
} from "@/types";

function getPortalEndpoint(path: string): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/dealer")) {
    return `/api/dealer${path.startsWith("/") ? path : `/${path}`}`;
  }
  return `/api/admin${path.startsWith("/") ? path : `/${path}`}`;
}

export const DashboardService = {
  getListingStats: async (): Promise<ListingStats> => {
    return fetchApi<ListingStats>(getPortalEndpoint("/listing-stats"));
  },
  getChartData: async (timeframe: string = "7d"): Promise<ChartDataPoint[]> => {
    const data = MOCK_CHART_DATA[timeframe] || MOCK_CHART_DATA["7d"];
    return fetchApi<ChartDataPoint[]>(getPortalEndpoint(`/analytics/chart?timeframe=${timeframe}`), {}, data);
  },
};

function getNotificationEndpoint(path: string): string {
  return getPortalEndpoint(path);
}

export const NotificationService = {
  getStats: async (): Promise<DashboardStats> => {
    return fetchApi<DashboardStats>(getNotificationEndpoint("/notifications/stats"), {}, MOCK_STATS);
  },
  getAll: async (): Promise<NotificationItem[]> => {
    return fetchApi<NotificationItem[]>(getNotificationEndpoint("/notifications"), {}, MOCK_NOTIFICATIONS);
  },
  getRecent: async (limit: number = 5): Promise<NotificationItem[]> => {
    const notifications = await fetchApi<NotificationItem[]>(getNotificationEndpoint(`/notifications/recent?limit=${limit}`), {}, MOCK_NOTIFICATIONS);
    return notifications.slice(0, limit);
  },
  getById: async (id: string): Promise<NotificationItem> => {
    return fetchApi<NotificationItem>(getNotificationEndpoint(`/notifications/${id}`), {}, MOCK_NOTIFICATIONS[0]);
  },
  send: async (notificationData: Record<string, any>): Promise<{ success: boolean; id?: string; queueId?: string | number; status?: string; message?: string }> => {
    return fetchApi<{ success: boolean; id?: string; queueId?: string | number; status?: string; message?: string }>(getNotificationEndpoint("/send"), {
      method: "POST",
      body: JSON.stringify(notificationData),
    });
  },
};

export const CampaignService = {
  getAll: async (): Promise<Campaign[]> => {
    return fetchApi<Campaign[]>("/campaigns", {}, process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ? MOCK_CAMPAIGNS : []);
  },
};

export const TemplateService = {
  getAll: async (): Promise<Template[]> => {
    return fetchApi<Template[]>("/templates", {}, process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ? MOCK_TEMPLATES : []);
  },
};

export const UserService = {
  getAll: async (search?: string): Promise<UserItem[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return fetchApi<UserItem[]>(`/users${query}`, {}, MOCK_USERS);
  },
  getById: async (id: string): Promise<UserItem> => {
    return fetchApi<UserItem>(`/users/${id}`, {}, MOCK_USERS[0]);
  },
};

export interface PaginationInfo {
  totalListings: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
  pagination: PaginationInfo;
}

export const VehicleService = {
  getAll: async (
    search?: string,
    page?: number,
    perPage?: number,
    make?: string,
    lang?: string
  ): Promise<VehiclesResponse> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (page) params.set("page", String(page));
    if (perPage) params.set("per_page", String(perPage));
    if (make && make !== "all") params.set("make", make);
    if (lang) params.set("lang", lang);
    const query = params.toString() ? `?${params.toString()}` : "";

    const rawResult = await fetchApi<any>(getPortalEndpoint(`/listings${query}`), {}, MOCK_VEHICLES);
    let rawList: any[] = [];
    if (Array.isArray(rawResult?.results)) {
      rawList = rawResult.results;
    } else if (Array.isArray(rawResult)) {
      rawList = rawResult;
    } else if (Array.isArray(rawResult?.listings)) {
      rawList = rawResult.listings;
    } else if (Array.isArray(rawResult?.data)) {
      rawList = rawResult.data;
    } else if (Array.isArray(rawResult?.posts)) {
      rawList = rawResult.posts;
    } else {
      rawList = MOCK_VEHICLES;
    }

    // Listivo Pagination Object Mapping
    const rawPag = rawResult?.pagination || {};
    const totalListings = Number(rawPag.total_listings ?? rawPag.total ?? rawList.length) || 0;
    const totalPages = Number(rawPag.total_pages ?? rawPag.totalPages ?? 1) || 1;
    const currentPage = Number(rawPag.current_page ?? rawPag.currentPage ?? page ?? 1) || 1;
    const slicedList = (perPage && perPage > 0) ? rawList.slice(0, perPage) : rawList;
    const vehicles = (slicedList || []).map((item: any) => {
      const post = item?.post || {};
      const meta = item?.meta || {};
      const taxonomies = item?.taxonomies || {};
      const relatedGuids = Array.isArray(item?.related_guids) ? item.related_guids : [];

      const listingId = String(post?.ID || item?.listingId || item?.id || item?.ID || "");
      const title = post?.post_title || item?.title || item?.post_title || "Untitled Vehicle";
      const makeVal = item?.make ?? taxonomies?.listivo_945 ?? item?.taxonomy_make;
      const modelVal = item?.model ?? taxonomies?.listivo_946 ?? item?.taxonomy_model;
      const make = getTaxonomyLabel(makeVal) || "N/A";
      const model = getTaxonomyLabel(modelVal) || "N/A";

      const rawPriceStr = meta?.listivo_130_listivo_13 ?? item?.price;
      const priceNum = Number(rawPriceStr);
      const hasValidPrice = rawPriceStr !== null && rawPriceStr !== undefined && String(rawPriceStr).trim() !== "" && !isNaN(priceNum);
      const price = hasValidPrice ? priceNum : 0;
      const formattedPrice = hasValidPrice ? `${priceNum.toLocaleString()} THB` : "—";

      const oldPrice = item?.oldPrice ? Number(item.oldPrice) : (meta?.listivo_8737_listivo_13 ? Number(meta.listivo_8737_listivo_13) : undefined);
      const rawStatus = item?.status || post?.post_status || "Publish";
      const status = (typeof rawStatus === "string" && (rawStatus.toLowerCase() === "publish" || rawStatus.toLowerCase() === "published")) ? "Publish" : rawStatus;
      const publishedDate = item?.publishedDate || post?.post_date || item?.date || "N/A";

      // Single source of truth for gallery resolution (first image is thumbnail)
      const gallery = normalizeListingGallery(item);
      const imageUrl = gallery.length > 0 ? gallery[0].url : "";
      
      const rawFeatured = meta?.featured ?? item?.featured;
      const featured = rawFeatured === "1" || rawFeatured === 1 || rawFeatured === true || String(rawFeatured ?? "").trim() === "1";

      const referenceCode = item?.referenceCode || meta?.listivo_8671 || item?.reference_code;
      const year = item?.year || (meta?.listivo_4316 ? Number(meta.listivo_4316) : undefined);
      const mileage = item?.mileage !== undefined ? item.mileage : (meta?.listivo_4686 ? Number(meta.listivo_4686) : undefined);

      const rawViews = item?.meta?.views ?? meta?.views ?? item?.views;
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
        price,
        formattedPrice,
        oldPrice,
        status,
        publishedDate,
        imageUrl,
        featured,
        featuredExpire: item?.featuredExpire || meta?.featured_expire,
        referenceCode,
        year,
        mileage,
        views,
        rawPayload: item,
      };
    });

    return {
      vehicles,
      pagination: {
        totalListings,
        totalPages,
        currentPage,
        perPage: Number(rawPag.per_page ?? rawPag.perPage ?? perPage ?? 10) || 10,
      },
    };
  },
  getById: async (id: string, lang?: string): Promise<any> => {
    const fallback = MOCK_VEHICLES.find((v) => String(v.listingId) === String(id)) || MOCK_VEHICLES[0];
    const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return fetchApi<any>(`/listings/${id}${query}`, {}, fallback);
  },
};

export const MakeModelService = {
  getMakes: async (): Promise<MakeAlert[]> => {
    return fetchApi<MakeAlert[]>("/makes", {}, MOCK_MAKES);
  },
  getModels: async (make?: string): Promise<ModelAlert[]> => {
    const query = make ? `?make=${encodeURIComponent(make)}` : "";
    return fetchApi<ModelAlert[]>(`/models${query}`, {}, MOCK_MODELS);
  },
};

export const AudienceService = {
  getEstimate: async (params: Record<string, string>): Promise<{ estimatedRecipients?: number; count?: number }> => {
    const queryString = new URLSearchParams(params).toString();
    return fetchApi<{ estimatedRecipients?: number; count?: number }>(`/audience?${queryString}`, {});
  },
};

export const AutomationService = {
  getRules: async (): Promise<AutomationRule[]> => {
    return fetchApi<AutomationRule[]>("/automation", {}, MOCK_AUTOMATION);
  },
};

export const QueueService = {
  getJobs: async (): Promise<QueueJob[]> => {
    return fetchApi<QueueJob[]>("/queue", {}, MOCK_QUEUE_JOBS);
  },
};

export const HealthService = {
  getHealth: async (): Promise<any> => {
    return fetchApi<any>(getPortalEndpoint("/health"), {}, { status: "healthy", version: "1.8.1" });
  },
};

export const ListingService = {
  getStats: async (): Promise<ListingStats> => {
    return fetchApi<ListingStats>(getPortalEndpoint("/listing-stats"));
  },
  getDataset: async (lang?: string): Promise<any> => {
    const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return fetchApi<any>(`/listings/dataset${query}`);
  },
  createListing: async (
    formData: FormData
  ): Promise<{ success: boolean; id?: string | number; listing_id?: string | number; message?: string; error?: string }> => {
    const url = getPortalEndpoint("/listings/create");
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const contentType = res.headers.get("content-type") || "";
    const responseText = await res.text();

    let data: any = null;
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        data = JSON.parse(responseText);
      } catch (_) {
        data = null;
      }
    }

    if (!res.ok) {
      const errorMessage =
        data?.error ||
        data?.message ||
        (res.status === 401
          ? "Your session has expired. Please log in again."
          : `API error ${res.status}: ${res.statusText || "Server error"}`);
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error("Received non-JSON response from server.");
    }

    return data;
  },
  updateListing: async (
    id: string | number,
    payload: Record<string, any> | FormData
  ): Promise<{ success: boolean; listing_id?: string | number; message?: string; error?: string }> => {
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      const url = getPortalEndpoint(`/listings/${id}/update`);
      const res = await fetch(url, {
        method: "POST",
        body: payload,
      });

      const contentType = res.headers.get("content-type") || "";
      const responseText = await res.text();
      let data: any = null;
      if (contentType.toLowerCase().includes("application/json")) {
        try {
          data = JSON.parse(responseText);
        } catch (_) {
          data = null;
        }
      }

      if (!res.ok) {
        const errorMessage =
          data?.error ||
          data?.message ||
          (res.status === 401
            ? "Your session has expired. Please log in again."
            : `API error ${res.status}: ${res.statusText || "Server error"}`);
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error("Received non-JSON response from server.");
      }

      return data;
    }

    return fetchApi<{ success: boolean; listing_id?: string | number; message?: string; error?: string }>(
      `/listings/${id}/update`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
  trashListing: async (
    id: string | number
  ): Promise<{ success: boolean; listing_id?: string | number; status?: string; message?: string; error?: string }> => {
    return fetchApi<{ success: boolean; listing_id?: string | number; status?: string; message?: string; error?: string }>(
      `/listings/${id}/trash`,
      {
        method: "DELETE",
      }
    );
  },
};

function getProfileEndpoint(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/dealer")) {
    return "/api/dealer/profile";
  }
  return "/api/admin/profile";
}

export const ProfileService = {
  getProfile: async (): Promise<{ success: boolean; data: UserProfile }> => {
    const endpoint = getProfileEndpoint();
    return fetchApi<{ success: boolean; data: UserProfile }>(endpoint);
  },

  updateProfile: async (
    payload: Partial<UserProfile>
  ): Promise<{ success: boolean; message?: string; data?: UserProfile }> => {
    const endpoint = getProfileEndpoint();
    return fetchApi<{ success: boolean; message?: string; data?: UserProfile }>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  uploadImage: async (
    file: File
  ): Promise<ProfileImageUploadResponse> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/admin/profile/image", {
      method: "POST",
      body: formData,
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    let data: any = null;
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = null;
      }
    }

    if (!res.ok) {
      const errorMessage =
        data?.error ||
        data?.message ||
        (res.status === 401
          ? "Your session has expired. Please log in again."
          : `API error ${res.status}: ${res.statusText || "Server error"}`);
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error("Received non-JSON response from server.");
    }

    return data as ProfileImageUploadResponse;
  },
};




