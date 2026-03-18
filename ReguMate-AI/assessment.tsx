"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Activity,
    Droplets,
    Factory,
    TrendingUp,
    Loader2,
} from "lucide-react";

export default function AssessmentPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalWells: 0,
        activeWells: 0,
        inactiveWells: 0,
        totalFacilities: 0,
        totalLiability: 0,
        lmrRatio: 0,
        riskTier: "—",
    });

    useEffect(() => {
        async function fetchAssessment() {
            try {
                const res = await fetch("/api/assessment");
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        totalWells: data.totalWells || 0,
                        activeWells: data.activeWells || 0,
                        inactiveWells: data.inactiveWells || 0,
                        totalFacilities: data.totalFacilities || 0,
                        totalLiability: data.totalLiability || 0,
                        lmrRatio: data.lmrRatio || 0,
                        riskTier: data.riskTier || "—",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch assessment:", err);
            }
            setLoading(false);
        }
        fetchAssessment();
    }, []);

    const getTierColor = (tier: string) => {
        switch (tier) {
            case "Tier 1":
                return "text-emerald-500 bg-emerald-500/5 border-emerald-500/40";
            case "Tier 2":
                return "text-amber-400 bg-amber-500/5 border-amber-500/40";
            case "Tier 3":
                return "text-rose-500 bg-rose-500/5 border-rose-500/40";
            default:
                return "text-zinc-500 bg-zinc-950 border-zinc-800";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-black">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                        LOADING ASSESSMENT
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-black">
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div className="border-b border-zinc-800 bg-black sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-none bg-cyan-500/10 border border-cyan-500/20">
                            <BarChart3 className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold font-mono">
                                HOLISTIC ASSESSMENT DASHBOARD
                            </h1>
                            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                SHADOW LICENSEE CAPABILITY ASSESSMENT (LCA) — AER DIRECTIVE 088
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-4 w-full space-y-4">
                {/* ── TIER BADGE ──────────────────────────────────────── */}
                <div className="flex items-center gap-4 p-3 bg-[#050505] border border-zinc-800 rounded-none">
                    <div
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-none border font-mono text-sm font-bold ${getTierColor(stats.riskTier)}`}
                    >
                        <Shield className="w-4 h-4" />
                        {stats.riskTier === "—"
                            ? "[ NO ASSESSMENT ]"
                            : `[ ${stats.riskTier.toUpperCase()} ]`}
                    </div>
                    <span className="font-mono text-[11px] text-zinc-500">
                        {stats.riskTier === "Tier 1" &&
                            "LOW RISK — STRONG REGULATORY STANDING"}
                        {stats.riskTier === "Tier 2" &&
                            "MODERATE RISK — CONSIDER OPTIMIZING"}
                        {stats.riskTier === "Tier 3" &&
                            "HIGH RISK — IMMEDIATE ACTION RECOMMENDED"}
                        {stats.riskTier === "—" &&
                            (stats.totalWells > 0
                                ? "WELL DATA LOADED — AWAITING HLA SNAPSHOT COMPUTATION"
                                : "UPLOAD WELL DATA OR AER CSVS TO GENERATE ASSESSMENT")}
                    </span>
                </div>

                {/* ── STATS GRID ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800">
                    <div className="bg-[#050505] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Droplets className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold font-mono">
                                TOTAL WELLS
                            </span>
                        </div>
                        <div className="font-mono text-2xl font-bold tabular-nums text-zinc-100">
                            {stats.totalWells}
                        </div>
                    </div>

                    <div className="bg-[#050505] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold font-mono">
                                ACTIVE
                            </span>
                        </div>
                        <div className="font-mono text-2xl font-bold tabular-nums text-emerald-500">
                            {stats.activeWells}
                        </div>
                    </div>

                    <div className="bg-[#050505] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold font-mono">
                                INACTIVE
                            </span>
                        </div>
                        <div className="font-mono text-2xl font-bold tabular-nums text-amber-400">
                            {stats.inactiveWells}
                        </div>
                    </div>

                    <div className="bg-[#050505] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Factory className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold font-mono">
                                FACILITIES
                            </span>
                        </div>
                        <div className="font-mono text-2xl font-bold tabular-nums text-zinc-100">
                            {stats.totalFacilities}
                        </div>
                    </div>
                </div>

                {/* ── LMR & FINANCIAL ─────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800">
                    <div className="bg-[#050505] p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold font-mono">
                                LIABILITY MANAGEMENT RATING (LMR)
                            </span>
                        </div>
                        <div className="font-mono text-3xl font-bold tabular-nums text-zinc-100 mb-1">
                            {stats.lmrRatio > 0
                                ? stats.lmrRatio.toFixed(3)
                                : "—"}
                        </div>
                        <p className="font-mono text-[10px] text-zinc-600 leading-relaxed">
                            DEEMED ASSETS ÷ DEEMED LIABILITY — TARGET: &gt;2.000 FOR TIER 1
                        </p>
                        {stats.lmrRatio > 0 && (
                            <div className="mt-3 relative">
                                <div className="h-px w-full bg-zinc-800" />
                                <div
                                    className="h-px absolute top-0 left-0"
                                    style={{
                                        width: `${Math.min((stats.lmrRatio / 3) * 100, 100)}%`,
                                        background:
                                            stats.lmrRatio >= 2
                                                ? "#10b981"
                                                : stats.lmrRatio >= 1
                                                  ? "#f59e0b"
                                                  : "#f43f5e",
                                    }}
                                />
                                {/* Threshold markers */}
                                <div className="flex justify-between mt-1.5">
                                    <span className="font-mono text-[9px] text-zinc-700">0</span>
                                    <span className="font-mono text-[9px] text-zinc-700">1.0</span>
                                    <span className="font-mono text-[9px] text-cyan-500/50">2.0</span>
                                    <span className="font-mono text-[9px] text-zinc-700">3.0</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#050505] p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold font-mono">
                                TOTAL DEEMED LIABILITY
                            </span>
                        </div>
                        <div className="font-mono text-3xl font-bold tabular-nums text-zinc-100 mb-1">
                            {stats.totalLiability > 0
                                ? new Intl.NumberFormat("en-CA", {
                                      style: "currency",
                                      currency: "CAD",
                                      minimumFractionDigits: 0,
                                  }).format(stats.totalLiability)
                                : "—"}
                        </div>
                        <p className="font-mono text-[10px] text-zinc-600 leading-relaxed">
                            COMBINED LIABILITY FROM WELLS &amp; FACILITIES — DIRECTIVE 011 COST MATRIX
                        </p>
                    </div>
                </div>

                {/* ── CTA ─────────────────────────────────────────────── */}
                {stats.totalWells === 0 && (
                    <div className="bg-[#050505] border border-dashed border-zinc-800 rounded-none p-6">
                        <div className="text-center">
                            <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-300 font-semibold mb-2">
                                NO WELL INVENTORY DETECTED
                            </h3>
                            <p className="font-mono text-[10px] text-zinc-600 max-w-lg mx-auto mb-4 leading-relaxed">
                                SEED AER DATA FROM THE DATA ROOM TO POPULATE WELL INVENTORY.
                                ASSESSMENT AUTO-GENERATES FROM WELL AND FACILITY DATA.
                            </p>
                            <a
                                href="/dashboard/data-room"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase tracking-[0.15em] font-semibold hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors"
                            >
                                [ GO TO DATA ROOM ]
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
