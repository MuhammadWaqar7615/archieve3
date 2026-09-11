import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat().format(num);
}

export function formatDateLocal(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === "—") return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function isFeaturedValue(val: any): boolean {
  if (val === true || val === 1 || val === "1" || val === "true" || val === "yes") {
    return true;
  }
  return false;
}

export function getTaxonomyLabel(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.name || val.english || val.thai || String(val.term_id ?? val.id ?? "");
  }
  return "";
}

export function getTaxonomyArrayLabels(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(getTaxonomyLabel)
    .filter((label) => label.trim() !== "");
}

