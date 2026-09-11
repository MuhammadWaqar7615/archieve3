"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Star, Trash2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxSizeMb?: number;
}

import { useTranslation } from "@/i18n/useTranslation";

export function ImageUploader({
  images = [],
  onChange,
  maxSizeMb = 10,
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const handleFiles = (incomingFiles: FileList | File[]) => {
    setUploadError(null);
    const validFiles: ImageItem[] = [];
    const filesArray = Array.from(incomingFiles);

    for (const file of filesArray) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setUploadError(`Invalid file format: ${file.name}. Only JPG, PNG, WEBP are supported.`);
        continue;
      }

      if (file.size > maxSizeMb * 1024 * 1024) {
        setUploadError(`File too large: ${file.name} exceeds ${maxSizeMb}MB.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      validFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
      });
    }

    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].previewUrl);
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(targetIndex, 0, moved);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] ${
          isDragging
            ? "border-[#FF9540] bg-orange-50/50"
            : "border-[#E6E8EC] bg-[#F7F8FA] hover:border-[#FF9540] hover:bg-orange-50/20"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-orange-100/80 flex items-center justify-center text-[#FF9540] mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-bold text-[#1B2935]">
          {t("placeholder.dragDrop")}
        </p>

        <p className="text-xs text-[#6B7280] mt-1">
          {t("placeholder.imageFormats")}
        </p>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Image Grid Previews */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1B2935]">
            <span>{t("common.uploadedImages", { count: images.length })}</span>
            <span className="text-[#6B7280] font-normal text-[11px]">
              {t("common.primaryThumbnailNotice")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden border bg-white shadow-xs transition flex flex-col ${
                    isPrimary ? "border-[#FF9540] ring-2 ring-orange-200" : "border-[#E6E8EC]"
                  }`}
                >
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={img.previewUrl}
                      alt={`Vehicle upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {isPrimary && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#FF9540] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-current" /> {t("common.primary")}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-lg opacity-90 hover:opacity-100 transition"
                      title={t("common.removeImage")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-1.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-mono pl-1">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, "left")}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition"
                        title={t("common.moveLeft")}
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, "right")}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition"
                        title={t("common.moveRight")}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
