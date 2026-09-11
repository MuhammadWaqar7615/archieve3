"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { OptionItem } from "./AutocompleteSelect";

interface MultiSelectAutocompleteProps {
  label?: string;
  options: OptionItem[];
  values: (number | string)[];
  onChange: (selected: (number | string)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

import { useTranslation } from "@/i18n/useTranslation";

export function MultiSelectAutocomplete({
  label,
  options = [],
  values = [],
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
}: MultiSelectAutocompleteProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t("common.searchAndSelectFeatures");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const getItemValue = (opt: OptionItem): string =>
    String(opt.value ?? opt.termId ?? opt.term_id ?? opt.id ?? "");
  const getItemLabel = (opt: OptionItem): string =>
    opt.label || opt.english || opt.thai || opt.name || String(getItemValue(opt));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = options.filter((opt) =>
    values.map(String).includes(getItemValue(opt))
  );

  const filteredOptions = options.filter((opt) =>
    getItemLabel(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (opt: OptionItem) => {
    const val = getItemValue(opt);
    const exists = values.map(String).includes(val);
    if (exists) {
      onChange(values.filter((v) => String(v) !== val));
    } else {
      const termId = opt.termId ?? opt.term_id ?? opt.value;
      onChange([...values, termId ?? val]);
    }
  };

  const removeValue = (valToRemove: string | number) => {
    onChange(values.filter((v) => String(v) !== String(valToRemove)));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-[#1B2935]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl">
          {selectedOptions.map((opt) => {
            const optVal = getItemValue(opt);
            const displayLabel = getItemLabel(opt);
            return (
              <span
                key={optVal}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-[#1B2935] border border-[#E6E8EC] rounded-lg text-xs font-medium shadow-2xs"
              >
                <span>{displayLabel}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeValue(opt.termId ?? opt.term_id ?? optVal)}
                  className="hover:bg-rose-50 hover:text-rose-600 rounded p-0.5 text-slate-400 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
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
          <span className="text-[#9CA3AF] truncate">{defaultPlaceholder}</span>
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
                  const isChecked = values.map(String).includes(optVal);
                  return (
                    <button
                      key={optVal}
                      type="button"
                      onClick={() => toggleOption(opt)}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-orange-50/60 transition ${
                        isChecked ? "bg-orange-50 text-[#FF9540] font-bold" : "text-[#1B2935]"
                      }`}
                    >
                      <span className="truncate">{getItemLabel(opt)}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#FF9540] shrink-0" />}
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
