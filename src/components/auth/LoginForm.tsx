"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

interface LoginFormProps {
  mode: "admin" | "dealer";
  redirectTo?: string;
}

export function LoginForm({ mode, redirectTo }: LoginFormProps) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  const isAdmin = mode === "admin";
  const badgeText = isAdmin ? "Super Admin Portal" : "Dealer Portal";
  const titleText = isAdmin ? "WOWCAR Super Admin Portal" : "WOWCAR Dealer Portal";
  const subtitleText = isAdmin
    ? "Sign in to manage the WOWCAR platform"
    : "Sign in to manage your dealership";
  const footerText = isAdmin
    ? "Requires authorized platform administrator privileges."
    : "Requires authorized dealer administrator privileges.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (!isAdmin) {
        // ── DEALER: dedicated endpoint + full browser navigation ──
        const res = await fetch("/api/dealer/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.message || "Invalid dealer credentials or insufficient permissions.");
          setPassword("");
          setLoading(false);
          return;
        }

        // Full browser navigation so the new session cookie is sent with the request
        window.location.replace("/dealer");
        return;
      }

      // ── ADMIN: dedicated endpoint + router navigation ──
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Invalid administrator credentials or insufficient permissions.");
        setPassword("");
        return;
      }

      setPassword("");
      const targetDestination = redirectTo || "/admin";
      router.push(targetDestination);
      router.refresh();
    } catch (err) {
      setErrorMsg("Invalid credentials or insufficient permissions.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E6E8EC] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-auto md:min-h-[520px]">
        {/* Desktop Left Dark Branding Panel */}
        <div className="hidden md:flex md:col-span-5 bg-[#1B2935] text-white p-8 md:p-10 flex-col justify-center items-start text-left relative overflow-hidden space-y-4">
          <div className="space-y-4 relative z-10 w-full">
            <img
              src="/Wow-Inverse.png"
              alt="WowCar Logo"
              className="h-10 w-auto object-contain max-w-[170px]"
            />
            <span className="text-xs font-bold text-[#FF9540] tracking-wider uppercase block">
              {badgeText}
            </span>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {titleText}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
              {subtitleText}
            </p>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FF9540]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Mobile Top Dark Branding Header (Matching Desktop Theme) */}
        <div className="block md:hidden bg-[#1B2935] text-white p-6 text-center space-y-3 relative overflow-hidden flex flex-col items-center justify-center">
          <img
            src="/Wow-Inverse.png"
            alt="WowCar Logo"
            className="h-9 w-auto object-contain max-w-[150px] mx-auto"
          />
          <h2 className="text-xl font-bold text-white leading-tight">
            {badgeText}
          </h2>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF9540]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Right Form Container — Clean White Layout Below Mobile Header */}
        <div className="md:col-span-7 p-6 sm:p-8 md:p-12 flex flex-col justify-center space-y-5 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start text-center md:text-left gap-3">
            <img
              src="/square3.png"
              alt="WowCar Icon"
              className="w-11 h-11 object-contain rounded-xl shadow-sm shrink-0 hidden md:block"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1B2935]">
                Sign In
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5 font-medium">
                {subtitleText}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#1B2935] block">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isAdmin ? "Super admin username" : "Dealer admin username"}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] focus:border-[#FF9540] focus:bg-white text-xs font-medium text-[#1B2935] rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#1B2935] block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] focus:border-[#FF9540] focus:bg-white text-xs font-medium text-[#1B2935] rounded-xl outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#6B7280] hover:text-[#1B2935] p-1 transition cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#FF9540] hover:bg-[#FF8420] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-[#6B7280] text-center">
            {footerText}
          </p>
        </div>
      </div>
    </div>
  );
}
