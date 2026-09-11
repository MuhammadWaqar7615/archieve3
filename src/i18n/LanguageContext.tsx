"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  PortalLanguageCode,
  ListivoLanguage,
  PORTAL_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
  getListivoLanguage,
} from "./config";
import { translations, TranslationKey } from "./translations";

interface LanguageContextType {
  language: PortalLanguageCode;
  listivoLanguage: ListivoLanguage;
  setLanguage: (code: PortalLanguageCode) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "wowcar_portal_language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<PortalLanguageCode>(DEFAULT_LANGUAGE_CODE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as PortalLanguageCode;
      if (saved && PORTAL_LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const setLanguage = (code: PortalLanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      document.cookie = `${STORAGE_KEY}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      // Ignore storage errors
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations[DEFAULT_LANGUAGE_CODE];
    let val = (langDict as Record<string, string>)[key];

    if (val === undefined) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing translation: ${language}:${key}`);
      }
      val = (translations[DEFAULT_LANGUAGE_CODE] as Record<string, string>)[key] || key;
    }

    if (params && typeof val === "string") {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return val;
  };

  const listivoLanguage = getListivoLanguage(language);

  return (
    <LanguageContext.Provider value={{ language, listivoLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
