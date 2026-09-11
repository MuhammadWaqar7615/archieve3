import { TranslationKey } from "@/i18n/translations/en";

export interface ReasonToBuyOption {
  value: string;
  labelKey: TranslationKey;
}

export const REASONS_TO_BUY_OPTIONS: ReasonToBuyOption[] = [
  {
    value: "Full Service Record",
    labelKey: "listing.reasons.fullServiceRecord",
  },
  {
    value: "Non-Flood Guarantee",
    labelKey: "listing.reasons.nonFloodGuarantee",
  },
  {
    value: "Single Owner",
    labelKey: "listing.reasons.singleOwner",
  },
  {
    value: "Accident Free",
    labelKey: "listing.reasons.accidentFree",
  },
  {
    value: "Low Mileage",
    labelKey: "listing.reasons.lowMileage",
  },
  {
    value: "Under Official Warranty",
    labelKey: "listing.reasons.officialWarranty",
  },
];
