import {
  LayoutDashboard,
  Send,
  Bell,
  UserCheck,
  ListOrdered,
  Settings,
  Car,
  LucideIcon,
} from "lucide-react";



import { TranslationKey } from "@/i18n/translations/en";

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  subItems?: SubNavItem[];
}

export interface NavSection {
  titleKey: TranslationKey;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "navigation.sections.main",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    titleKey: "navigation.sections.listings",
    items: [
      {
        id: "listings",
        label: "Listings",
        href: "/vehicles",
        icon: Car,
        subItems: [
          { id: "all-listings", label: "All Listings", href: "/vehicles" },
          { id: "add-new-listing", label: "Add New Listing", href: "/listings/create" },
        ],
      },
    ],
  },
  {
    titleKey: "navigation.sections.notifications",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        href: "/notifications/stats",
        icon: Bell,
        subItems: [
          { id: "notification-stats", label: "Notification Statistics", href: "/notifications/stats" },
          { id: "send-notification", label: "Send Notification", href: "/send" },
          { id: "notification-history", label: "Notification History", href: "/notifications" },
        ],
      },
    ],
  },
  {
    titleKey: "navigation.sections.management",
    items: [
      { id: "users", label: "Users", href: "/users", icon: UserCheck },
    ],
  },
  {
    titleKey: "navigation.sections.monitoring",
    items: [
      { id: "logs", label: "Delivery Logs", href: "/logs", icon: ListOrdered },
    ],
  },
  {
    titleKey: "navigation.sections.system",
    items: [
      { id: "settings", label: "Profile Settings", href: "/settings", icon: Settings },
    ],
  },
];

// Flattened items for route resolution and header labels
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((sec) => sec.items);

export function getFilteredNavSections(
  _unused?: unknown,
  prefix: string = ""
): NavSection[] {
  if (!prefix) return NAV_SECTIONS;

  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: `${prefix}${item.href === "/" ? "" : item.href}`,
      subItems: item.subItems?.map((sub) => ({
        ...sub,
        href: `${prefix}${sub.href === "/" ? "" : sub.href}`,
      })),
    })),
  }));
}

