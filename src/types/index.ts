export type LanguageCode = 'th' | 'en' | 'zh';

export type NotificationType = 
  | 'general_announcement' 
  | 'new_arrival' 
  | 'vehicle_notification' 
  | 'promotion' 
  | 'news' 
  | 'favourite_update' 
  | 'price_drop' 
  | 'external_link' 
  | 'custom';

export type NotificationStatus = 
  | 'delivered' 
  | 'pending' 
  | 'processing' 
  | 'failed' 
  | 'skipped' 
  | 'scheduled';

export type AudienceType = 
  | 'all' 
  | 'specific_users' 
  | 'wp_user_ids' 
  | 'registered_devices' 
  | 'make_followers' 
  | 'model_followers' 
  | 'selected_make' 
  | 'selected_model' 
  | 'users_by_language' 
  | 'custom_segment';

export type ActionType = 
  | 'inbox' 
  | 'vehicle' 
  | 'favourites' 
  | 'search' 
  | 'documents' 
  | 'profile' 
  | 'buy_car' 
  | 'external_url' 
  | 'no_action';

export interface NotificationTranslation {
  title: string;
  message: string;
}

export interface SendNotificationPayload {
  type: NotificationType;
  audience: string;
  audienceType: AudienceType;
  targetLanguages: LanguageCode[];
  translations: Record<string, NotificationTranslation>;
  actionType: ActionType;
  actionPayload?: Record<string, any>;
  imageUrl?: string | null;
  scheduledAt?: string | null;
  targetUserIds?: (string | number)[];
  makeIds?: number[];
  modelIds?: number[];
  targetMake?: string;
  targetModel?: string;
  createdBy?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  translations: Record<LanguageCode, NotificationTranslation>;
  type: NotificationType;
  audience: string;
  audienceType: AudienceType;
  targetLanguages: LanguageCode[];
  status: NotificationStatus;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  failedCount: number;
  created: string;
  sentAt?: string;
  scheduledAt?: string;
  createdBy: string;
  actionType: ActionType;
  actionPayload?: Record<string, any>;
  imageUrl?: string;
  listingId?: string;
  oneSignalId?: string;
  makeIds?: number[];
  modelIds?: number[];
  targetMake?: string;
  targetModel?: string;
  failureReason?: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled';

export interface Campaign {
  id: string;
  name: string;
  type: NotificationType;
  audience: string;
  status: CampaignStatus;
  sent: number;
  delivered: number;
  opened: number;
  ctr: string;
  scheduledDate: string;
  createdBy: string;
}

export interface Template {
  id: string;
  name: string;
  type: NotificationType;
  translations: Record<LanguageCode, NotificationTranslation>;
  destinationType: ActionType;
  defaultImageBehavior: 'custom' | 'vehicle' | 'none';
}

export interface UserItem {
  wpUserId: string;
  name: string;
  email: string;
  language: LanguageCode;
  platform: 'iOS' | 'Android' | 'Web';
  registeredDevices: number;
  pushEnabled: boolean;
  lastSeen: string;
  priceDropAlerts: boolean;
  newArrivalAlerts: boolean;
  oneSignalExternalId: string;
}

export interface Vehicle {
  listingId: string;
  title: string;
  make: string;
  model: string;
  price: number;
  formattedPrice: string;
  oldPrice?: number;
  status: 'Publish' | 'published' | 'publish' | 'draft' | 'sold' | 'trash';
  publishedDate: string;
  imageUrl: string;

  // Extended fields for details and management
  views?: number | null;
  featured?: boolean | string | number;
  featuredExpire?: string | number;
  referenceCode?: string;
  year?: number | string;
  mileage?: number | string;
  modelSpecific?: string;
  reasonsToBuy?: string;
  dealerPrice?: number | string;
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  color?: string;
  engineSize?: string;
  doorCount?: string;
  safetyFeatures?: string[];
  comfortFeatures?: string[];
  imageTags?: string[];
  address?: string;
  lat?: string | number;
  lng?: string | number;
  lineId?: string;
  videoUrl?: string;
  description?: string;
  descriptions?: Record<string, string>;
  images?: Array<{ id?: number | string; attachment_id?: number | string; url: string }>;
  rawPayload?: Record<string, any>;
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: string | number;
  year?: string | number;
  mileage?: string | number;
  reference_code?: string;
  model_specific?: string;
  reasons_to_buy?: string;
  dealer_price?: string | number;
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  line_id?: string;
  featured?: string | number;
  expire?: string;
  featured_expire?: string | number;
  make?: string | number;
  model?: string | number;
  body_style?: string | number;
  fuel_type?: string | number;
  transmission?: string | number;
  drivetrain?: string | number;
  color?: string | number;
  engine_size?: string | number;
  door_count?: string | number;
  safety_features?: (string | number)[];
  comfort_features?: (string | number)[];
  image_tags?: (string | number)[];
  existing_image_ids?: (number | string)[];
  [key: string]: any;
}

export interface TrashListingResponse {
  success: boolean;
  message?: string;
  listing_id?: string | number;
  status?: string;
  error?: string;
}


export interface MakeAlert {
  id: string | number;
  make: string;
  term_id?: number;
  termId?: number;
  name?: string;
  followers?: number;
  notificationsSent?: number;
  lastAlert?: string;
  enabled?: boolean;
}

export interface ModelAlert {
  id: string | number;
  make: string;
  model: string;
  term_id?: number;
  termId?: number;
  name?: string;
  followers?: number;
  notificationsSent?: number;
  lastAlert?: string;
  enabled?: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  type: 'price_drop' | 'new_arrival' | 'favourite_updates' | 'make_model_alerts';
  status: 'active' | 'paused' | 'planned';
  description: string;
  lastTriggered: string;
  notificationsGenerated: number;
  failedJobs: number;
}

export interface QueueJob {
  queueId: string;
  type: string;
  listingId?: string;
  status: 'pending' | 'processing' | 'sent' | 'skipped' | 'failed';
  attempts: number;
  recipients: number;
  created: string;
  sentAt?: string;
  failureReason?: string;
  payload: Record<string, any>;
}

export interface DashboardStats {
  totalSent: number;
  delivered: number;
  opened: number;
  failed: number;
  pendingQueue: number;
  registeredDevices: number;
  activeUsers: number;
  newArrivalsSent: number;
  deliveryRate: number;
  openRate: number;
  failureRate: number;
  sentTrend: number;
  deliveredTrend: number;
  openedTrend: number;
  failedTrend: number;
}

export interface ListingStats {
  total: number;
  published: number;
  draft: number;
  pending: number;
  trash: number;
  featured: number;
  last7Days: number;
  last30Days: number;
}

export interface ChartDataPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
}

export interface UserProfile {
  ID: number;
  username: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  phone_country_code: string;
  phone: string;
  address: string;
  lat: string;
  lng: string;
  line_id: string;
  description: string;
  image: number;
  facebook_profile: string;
  instagram_profile: string;
  you_tube_profile: string;
  linked_in_profile: string;
  twitter_profile: string;
  tiktok_profile: string;
}

export interface ProfileImageUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    attachment_id: number;
    image_url: string;
    profile?: Partial<UserProfile>;
  };
  error?: string;
}

