"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TemplateService } from "@/lib/api/services";
import { Template } from "@/types";
import { FileText, ArrowRight } from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await TemplateService.getAll();
        setTemplates(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="h-96 bg-slate-200 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935]">
            Notification Templates
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Pre-approved multi-language push copy blueprints for quick dispatch
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF9540] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B2935]">No templates created yet.</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Template persistence endpoints are currently read-only in the server backend release.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF9540] flex items-center justify-center font-bold text-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1B2935] text-sm">{tpl.name}</h3>
                      <span className="text-[10px] font-bold uppercase text-[#FF9540] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/50">
                        {tpl.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase">English Template</span>
                  <p className="font-bold text-[#1B2935]">{tpl.translations.en.title}</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{tpl.translations.en.message}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => router.push("/send")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#FF9540] hover:bg-orange-100 font-bold text-xs rounded-xl transition ml-auto"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
