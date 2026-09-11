"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export interface OptionItem {
  label: string;
  value: string;
  termId?: number | string;
  term_id?: number | string;
  thai?: string;
  english?: string;
  id?: number | string;
  name?: string;
}

interface AutocompleteSelectProps {
  label?: string;
  options: OptionItem[];
  value: number | string | null | undefined;
  onChange: (option: OptionItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

import { useTranslation } from "@/i18n/useTranslation";

export function AutocompleteSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
}: AutocompleteSelectProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t("placeholder.select", { field: label || "" });
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const getItemValue = (opt: OptionItem): string =>
    String(opt.value ?? opt.termId ?? opt.term_id ?? opt.id ?? "");
  const getItemLabel = (opt: OptionItem): string =>
    opt.label || opt.english || opt.thai || opt.name || String(getItemValue(opt));

  const selectedOption = options.find(
    (opt) => getItemValue(opt) === String(value)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    getItemLabel(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-[#1B2935]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setSearchTerm("");
            }
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-[#F7F8FA] border rounded-xl text-xs text-left transition ${
            error
              ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
              : isOpen
              ? "border-[#FF9540] ring-2 ring-orange-100 bg-white"
              : "border-[#E6E8EC] hover:border-slate-300"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : "cursor-pointer"}`}
        >
          <span className={`truncate ${selectedOption ? "text-[#1B2935] font-medium" : "text-[#9CA3AF]"}`}>
            {selectedOption ? getItemLabel(selectedOption) : defaultPlaceholder}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {selectedOption && !disabled && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E6E8EC] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("common.typeToFilter")}
                autoFocus
                className="w-full bg-transparent text-xs outline-none text-[#1B2935] placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-slate-400 italic">
                  {t("common.noMatchingOptions")}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const optVal = getItemValue(opt);
                  const isSelected = optVal === String(value);
                  return (
                    <button
                      key={optVal}
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-orange-50/60 transition ${
                        isSelected ? "bg-orange-50 text-[#FF9540] font-bold" : "text-[#1B2935]"
                      }`}
                    >
                      <span className="truncate">{getItemLabel(opt)}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#FF9540] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  );
}
