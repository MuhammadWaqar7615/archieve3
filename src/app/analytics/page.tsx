"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DashboardService } from "@/lib/api/services";
import { ChartDataPoint } from "@/types";

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("7d");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChart() {
      setLoading(true);
      try {
        const data = await DashboardService.getChartData(timeframe);
        setChartData(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadChart();
  }, [timeframe]);

  const typeData = [
    { name: "New Arrival", count: 18400 },
    { name: "Price Drop", count: 12200 },
    { name: "Promotion", count: 8900 },
    { name: "Announcements", count: 4200 },
    { name: "Vehicle Alerts", count: 2192 },
  ];

  const langData = [
    { name: "Thai (TH)", value: 7120, color: "#FF9540" },
    { name: "English (EN)", value: 1420, color: "#2563EB" },
    { name: "Chinese (ZH)", value: 680, color: "#F59E0B" },
  ];

  const platformData = [
    { name: "Android", value: 5210, color: "#16A34A" },
    { name: "iOS", value: 4272, color: "#1B2935" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[#1B2935]">
            Advanced Analytics & Push Performance
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Deep dive into user engagement, language distributions, and conversion metrics
          </p>
        </div>

        <div className="flex items-center bg-[#F7F8FA] p-1 rounded-xl text-xs font-semibold border border-[#E6E8EC]">
          {(["7d", "30d", "90d"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
                timeframe === tf ? "bg-[#FF9540] text-white shadow-sm" : "text-[#6B7280]"
              }`}
            >
              {tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
        <h3 className="font-bold text-[#1B2935] text-sm">Notifications Sent & Engagement Over Time</h3>
        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EC" />
                <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="sent" stroke="#FF9540" fill="#FF9540" fillOpacity={0.2} name="Sent" />
                <Area type="monotone" dataKey="delivered" stroke="#16A34A" fill="#16A34A" fillOpacity={0.2} name="Delivered" />
                <Area type="monotone" dataKey="opened" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} name="Opened" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
          <h3 className="font-bold text-[#1B2935] text-xs uppercase tracking-wider">Notifications by Type</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF9540" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
          <h3 className="font-bold text-[#1B2935] text-xs uppercase tracking-wider">Language Distribution</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={langData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {langData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-sm space-y-4">
          <h3 className="font-bold text-[#1B2935] text-xs uppercase tracking-wider">Device Platform Split</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
