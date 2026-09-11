"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartDataPoint } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { DashboardService } from "@/lib/api/services";

interface PerformanceChartProps {
  deliveryRate: number;
  openRate: number;
  failureRate: number;
  initialData?: ChartDataPoint[];
}

export function PerformanceChart({
  deliveryRate,
  openRate,
  failureRate,
  initialData = [],
}: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("7d");
  const [chartData, setChartData] = useState<ChartDataPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchChart() {
      setLoading(true);
      try {
        const data = await DashboardService.getChartData(timeframe);
        setChartData(data || []);
      } catch (err) {
        console.error("Failed to load chart data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChart();
  }, [timeframe]);

  // Format dates: 7d starts from Monday, 30d starts from 1st of month
  const formatDateTick = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr;
  };

  const latestPoint = chartData[chartData.length - 1] || { sent: 0, delivered: 0, opened: 0 };

  return (
    <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1B2935]">
            Notification Activity
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Daily tracking of notification dispatch volume across target devices
          </p>
        </div>

        {/* Timeframe Selector Tabs */}
        <div className="flex items-center bg-[#F7F8FA] p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-[#E6E8EC] shrink-0">
          {(["7d", "30d", "90d"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-3 py-1.5 rounded-lg transition capitalize font-bold cursor-pointer",
                timeframe === tf
                  ? "bg-[#FF9540] text-white shadow-xs"
                  : "text-[#6B7280] hover:text-[#1B2935]"
              )}
            >
              {tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend / Metrics Badges */}
      <div className="flex items-center gap-6 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF9540]" />
          <span className="text-[#6B7280]">Sent:</span>
          <span className="font-mono font-bold text-[#1B2935]">{formatNumber(latestPoint.sent)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[#6B7280]">Delivered:</span>
          <span className="font-mono font-bold text-[#1B2935]">{formatNumber(latestPoint.delivered)}</span>
        </div>
      </div>

      {/* Ultra-Simple Line Chart */}
      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EC" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 600 }}
                dy={5}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, "auto"]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 500 }}
                width={36}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-[#1B2935] text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1.5">
                      <p className="font-bold border-b border-slate-700 pb-1">{label}</p>
                      {payload.map((p: any) => (
                        <div key={p.name} className="flex items-center justify-between gap-4">
                          <span className="text-slate-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                            {p.name}:
                          </span>
                          <span className="font-mono font-bold text-white">{formatNumber(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="sent"
                stroke="#FF9540"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#FF9540" }}
                name="Sent"
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#16A34A"
                strokeWidth={2}
                dot={{ r: 3, fill: "#16A34A" }}
                name="Delivered"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
