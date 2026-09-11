export type PortalLanguageCode = "en" | "th" | "zh";
export type ListivoLanguage = "english" | "thai" | "chinese";

export interface PortalLanguageOption {
  code: PortalLanguageCode;
  label: string;
  listivoLanguage: ListivoLanguage;
  dir: "ltr";
}

export const PORTAL_LANGUAGES: readonly PortalLanguageOption[] = [
  {
    code: "en",
    label: "English",
    listivoLanguage: "english",
    dir: "ltr",
  },
  {
    code: "th",
    label: "ไทย",
    listivoLanguage: "thai",
    dir: "ltr",
  },
  {
    code: "zh",
    label: "中文",
    listivoLanguage: "chinese",
    dir: "ltr",
  },
] as const;

export const DEFAULT_LANGUAGE_CODE: PortalLanguageCode = "en";

export function getListivoLanguage(code: PortalLanguageCode): ListivoLanguage {
  const found = PORTAL_LANGUAGES.find((lang) => lang.code === code);
  return found ? found.listivoLanguage : "english";
}
