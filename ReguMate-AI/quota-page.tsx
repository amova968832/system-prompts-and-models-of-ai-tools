"use client";

import { useState, useEffect, useMemo } from "react";
import { calculateQuota } from "@/lib/calculators/quota";
import {
    Calculator,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    ArrowRight,
    Info,
    Banknote,
    Loader2,
    Check,
    Droplets,
    Factory,
    BarChart3,
} from "lucide-react";

interface WellRow {
    id: string;
    uwi: string;
    well_type: string | null;
    area_code: string | null;
    status: string | null;
    deemed_liability: number;
    inactive_months: number;
    license_number: string | null;
}

interface QuotaData {
    totalLiability: number;
    wellLiability: number;
    facilityLiability: number;
    totalSpend: number;
    totalWells: number;
    activeWells: number;
    inactiveWells: number;
    wells: WellRow[];
}

export default function QuotaPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<QuotaData | null>(null);
    const [selectedWells, setSelectedWells] = useState<Set<string>>(new Set());
    const [actualSpend, setActualSpend] = useState<string>("0");

    useEffect(() => {
        async function fetchQuotaData() {
            try {
                const res = await fetch("/api/quota");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                    setActualSpend(String(json.totalSpend || 0));
                }
            } catch (err) {
                console.error("Failed to fetch quota data:", err);
            }
            setLoading(false);
        }
        fetchQuotaData();
    }, []);

    // Calculate the simulated closure savings from selected wells
    const simulatedSavings = useMemo(() => {
        if (!data) return 0;
        return data.wells
            .filter((w) => selectedWells.has(w.id))
            .reduce((sum, w) => sum + (Number(w.deemed_liability) || 0) * 0.8, 0);
    }, [data, selectedWells]);

    // Compute quota result
    const result = useMemo(() => {
        if (!data || data.totalLiability === 0) return null;
        const spend = (parseFloat(actualSpend) || 0) + simulatedSavings;
        return calculateQuota(data.totalLiability, spend);
    }, [data, actualSpend, simulatedSavings]);

    // Wells sorted by efficiency ratio (highest first)
    const optimizerWells = useMemo(() => {
        if (!data) return [];
        return data.wells
            .filter((w) => (Number(w.deemed_liability) || 0) > 0)
            .map((w) => {
                const liability = Number(w.deemed_liability) || 0;
                const closureCost = liability * 0.8;
                const efficiency = closureCost > 0 ? liability / closureCost : 0;
                return { ...w, closureCost, efficiency, liability };
            })
            .sort((a, b) => b.efficiency - a.efficiency);
    }, [data]);

    const toggleWell = (id: string) => {
        setSelectedWells((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        const allIds = optimizerWells.map((w) => w.id);
        setSelectedWells(new Set(allIds));
    };

    const clearAll = () => setSelectedWells(new Set());

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);

    const formatCompact = (n: number) =>
        new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(n);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-black">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                        LOADING QUOTA DATA
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-black">
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div className="border-b border-zinc-800 bg-black sticky top-0 z-10">
                <div className="max-w-[1400px] mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-none bg-cyan-500/10 border border-cyan-500/20">
                                <Calculator className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold font-mono">
                                    2026 MANDATORY CLOSURE SPEND CALCULATOR
                                </h1>
                                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                    LIVE PORTFOLIO DATA — $750M INDUSTRY-WIDE CLOSURE SPEND TARGET
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 py-4 w-full space-y-4">
                {/* ── INFO BANNER ─────────────────────────────────────── */}
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-none bg-cyan-500/5 border border-cyan-500/10">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">
                        <span className="text-cyan-400 font-semibold">
                            2026 SINGLE-RATE RULE:
                        </span>{" "}
                        Every licensee pays a proportionate share based strictly on
                        inactive liability. The two-rate discount has been eliminated.
                        Select wells below to simulate planned closures and optimize
                        your spend.
                    </p>
                </div>

                {/* ── KPI CARDS ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
                    {/* Total Liability */}
                    <div className="bg-[#050505] border-r border-zinc-900 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                TOTAL LIABILITY
                            </span>
                            <DollarSign className="w-3 h-3 text-rose-500" />
                        </div>
                        <div className="font-mono text-xl font-bold text-zinc-100 tabular-nums">
                            {formatCompact(data?.totalLiability || 0)}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 tabular-nums font-mono">
                            WELLS {formatCompact(data?.wellLiability || 0)} · FAC {formatCompact(data?.facilityLiability || 0)}
                        </p>
                    </div>

                    {/* 2026 Quota */}
                    <div className="bg-[#050505] border-r border-zinc-900 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                2026 QUOTA
                            </span>
                            <Target className="w-3 h-3 text-emerald-500" />
                        </div>
                        <div className="font-mono text-xl font-bold text-emerald-500 tabular-nums">
                            {result ? formatCurrency(result.userQuota) : "—"}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                            MANDATORY CLOSURE SPEND
                        </p>
                    </div>

                    {/* Wells */}
                    <div className="bg-[#050505] border-r border-zinc-900 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                WELLS
                            </span>
                            <Droplets className="w-3 h-3 text-cyan-400" />
                        </div>
                        <div className="font-mono text-xl font-bold text-zinc-100 tabular-nums">
                            {data?.totalWells || 0}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 tabular-nums font-mono">
                            {data?.activeWells || 0} ACTIVE · {data?.inactiveWells || 0} INACTIVE
                        </p>
                    </div>

                    {/* Simulated Spend */}
                    <div className="bg-[#050505] p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                SIMULATED SPEND
                            </span>
                            <span className="text-[10px] text-zinc-600 tabular-nums font-mono">
                                {selectedWells.size} SEL
                            </span>
                        </div>
                        <div className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                            {formatCurrency(simulatedSavings + (parseFloat(actualSpend) || 0))}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                            CLOSURE + ACTUAL COMBINED
                        </p>
                    </div>
                </div>

                {/* ── ACTUAL SPEND INPUT ──────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.2em] font-mono">
                            ACTUAL CLOSURE SPEND TO DATE
                        </label>
                        <div className="relative">
                            <span className="text-[11px] text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 font-mono">$</span>
                            <input
                                type="number"
                                value={actualSpend}
                                onChange={(e) => setActualSpend(e.target.value)}
                                placeholder="0"
                                className="w-full pl-7 pr-3 py-2 rounded-none bg-[#050505] border border-zinc-800 text-sm text-zinc-100 tabular-nums font-mono placeholder:text-zinc-800 focus:outline-none focus:border-cyan-500/40 transition-colors"
                                id="actual-spend-input"
                            />
                        </div>
                        <p className="text-[10px] text-zinc-700 font-mono">
                            ABANDONMENT, RECLAMATION, AND REMEDIATION SPEND FOR 2026
                        </p>
                    </div>
                </div>

                {/* ── RESULTS ─────────────────────────────────────────── */}
                {result && (
                    <div className="space-y-4">
                        {/* Progress Bar Card */}
                        <div className="bg-[#050505] border border-zinc-800 rounded-none p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Target className="w-3 h-3 text-cyan-400" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                        QUOTA PROGRESS
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                                    {formatCurrency(
                                        (parseFloat(actualSpend) || 0) + simulatedSavings
                                    )}{" "}
                                    / {formatCurrency(result.userQuota)}
                                </span>
                            </div>
                            {/* Razor-thin segmented progress bar */}
                            <div className="relative h-px w-full bg-zinc-800 mb-2">
                                <div
                                    className="absolute top-0 left-0 h-px transition-all duration-700 ease-out"
                                    style={{
                                        width: `${Math.min(result.quotaPercentComplete, 100)}%`,
                                        background:
                                            result.quotaPercentComplete >= 100
                                                ? "#10b981"
                                                : result.quotaPercentComplete >= 50
                                                    ? "#f59e0b"
                                                    : "#f43f5e",
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-600 tabular-nums font-mono">
                                    {result.quotaPercentComplete}%
                                </span>
                                <span
                                    className={`font-mono text-[11px] font-semibold tabular-nums ${result.surplus >= 0
                                            ? "text-emerald-500"
                                            : "text-rose-500"
                                        }`}
                                >
                                    {result.surplus >= 0 ? "SURPLUS +" : "DEFICIT "}
                                    {formatCurrency(Math.abs(result.surplus))}
                                </span>
                            </div>
                        </div>

                        {/* Detail Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800">
                            <div className="bg-[#050505] p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                        REMAINING
                                    </span>
                                    <DollarSign className="w-3 h-3 text-zinc-700" />
                                </div>
                                <div
                                    className={`font-mono text-xl font-bold tabular-nums ${result.surplus >= 0
                                            ? "text-emerald-500"
                                            : "text-amber-400"
                                        }`}
                                >
                                    {result.surplus >= 0
                                        ? formatCurrency(0)
                                        : formatCurrency(Math.abs(result.surplus))}
                                </div>
                            </div>

                            <div className="bg-[#050505] p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                        SURPLUS / DEFICIT
                                    </span>
                                    {result.surplus >= 0 ? (
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 text-rose-500" />
                                    )}
                                </div>
                                <div
                                    className={`font-mono text-xl font-bold tabular-nums ${result.surplus >= 0
                                            ? "text-emerald-500"
                                            : "text-rose-500"
                                        }`}
                                >
                                    {result.surplus >= 0 ? "+" : ""}
                                    {formatCurrency(result.surplus)}
                                </div>
                            </div>

                            <div className="bg-[#050505] p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono">
                                        BANKED CREDIT
                                    </span>
                                    <Banknote className="w-3 h-3 text-zinc-700" />
                                </div>
                                <div
                                    className={`font-mono text-xl font-bold tabular-nums ${result.bankedCredit > 0
                                            ? "text-cyan-400"
                                            : "text-zinc-700"
                                        }`}
                                >
                                    {formatCurrency(result.bankedCredit)}
                                </div>
                                <p className="text-[10px] text-zinc-700 mt-1 font-mono">
                                    {result.bankedCredit > 0
                                        ? "ELIGIBLE FOR 2027 BANKING"
                                        : "SURPLUS MUST EXCEED 20% OF QUOTA"}
                                </p>
                            </div>
                        </div>

                        {/* Formula Breakdown */}
                        <div className="bg-[#050505] border border-zinc-800 rounded-none p-3">
                            <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold font-mono mb-2.5">
                                CALCULATION BREAKDOWN
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 font-mono tabular-nums">
                                <span className="px-2 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-zinc-300">
                                    {formatCurrency(result.userInactiveLiability)}
                                </span>
                                <span className="text-zinc-700">÷</span>
                                <span className="px-2 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-zinc-300">
                                    {formatCurrency(result.industryTotalLiability)}
                                </span>
                                <span className="text-zinc-700">×</span>
                                <span className="px-2 py-1 rounded-none bg-zinc-900 border border-zinc-800 text-zinc-300">
                                    $750,000,000
                                </span>
                                <ArrowRight className="w-3 h-3 text-zinc-700" />
                                <span className="px-2 py-1 rounded-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold">
                                    {formatCurrency(result.userQuota)}
                                </span>
                            </div>
                            <p className="text-[10px] text-zinc-700 mt-2 font-mono">
                                AER BULLETIN 2025-27 — SINGLE-RATE FRAMEWORK. INDUSTRY TOTAL: $30B.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── CLOSURE OPTIMIZER TABLE ─────────────────────────── */}
                {optimizerWells.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                                <div>
                                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold font-mono">
                                        CLOSURE OPTIMIZER
                                    </h2>
                                    <p className="text-[10px] text-zinc-600 font-mono">
                                        RANKED BY LIABILITY-REDUCTION EFFICIENCY
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={selectAll}
                                    className="px-2.5 py-1 text-[10px] font-semibold font-mono uppercase tracking-[0.1em] rounded-none bg-[#050505] text-cyan-400 hover:bg-cyan-500/10 transition-colors border border-zinc-800 hover:border-cyan-500/30"
                                >
                                    [ SELECT ALL ]
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="px-2.5 py-1 text-[10px] font-semibold font-mono uppercase tracking-[0.1em] rounded-none bg-[#050505] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors border border-zinc-800"
                                >
                                    [ CLEAR ]
                                </button>
                            </div>
                        </div>

                        <div className="rounded-none border border-zinc-800 overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[36px_1fr_100px_130px_130px_90px] gap-0 bg-[#050505] text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-semibold font-mono border-b border-zinc-800">
                                <div className="px-2 py-2 flex items-center justify-center">
                                    <Check className="w-3 h-3" />
                                </div>
                                <div className="px-3 py-2">UWI</div>
                                <div className="px-3 py-2">AREA</div>
                                <div className="px-3 py-2 text-right">LIABILITY</div>
                                <div className="px-3 py-2 text-right">EST. COST</div>
                                <div className="px-3 py-2 text-right">EFF.</div>
                            </div>

                            {/* Table Body */}
                            <div className="max-h-[360px] overflow-y-auto">
                                {optimizerWells.map((w) => {
                                    const isSelected = selectedWells.has(w.id);
                                    return (
                                        <div
                                            key={w.id}
                                            onClick={() => toggleWell(w.id)}
                                            className={`grid grid-cols-[36px_1fr_100px_130px_130px_90px] gap-0 text-[11px] cursor-pointer transition-colors border-b border-zinc-900 ${isSelected
                                                    ? "bg-cyan-500/[0.03] border-l-2 border-l-cyan-500 hover:bg-cyan-500/[0.06]"
                                                    : "bg-black hover:bg-zinc-900 border-l-2 border-l-transparent"
                                                }`}
                                        >
                                            <div className="px-2 py-1.5 flex items-center justify-center">
                                                <div
                                                    className={`w-3 h-3 rounded-none border flex items-center justify-center transition-all ${isSelected
                                                            ? "bg-cyan-500 border-cyan-500"
                                                            : "border-zinc-700"
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <Check className="w-2 h-2 text-black" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 font-mono text-[11px] text-zinc-300 truncate">
                                                {w.uwi}
                                            </div>
                                            <div className="px-3 py-1.5 text-zinc-600 truncate font-mono text-[11px]">
                                                {w.area_code || "—"}
                                            </div>
                                            <div className="px-3 py-1.5 text-right text-zinc-200 tabular-nums font-mono">
                                                {formatCurrency(w.liability)}
                                            </div>
                                            <div className="px-3 py-1.5 text-right text-amber-400 tabular-nums font-mono">
                                                {formatCurrency(w.closureCost)}
                                            </div>
                                            <div className="px-3 py-1.5 text-right">
                                                <span
                                                    className={`inline-block px-1.5 py-0.5 rounded-none font-mono text-[10px] font-semibold tabular-nums ${w.efficiency >= 1.25
                                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                            : w.efficiency >= 1.0
                                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                                                        }`}
                                                >
                                                    {w.efficiency.toFixed(2)}x
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Optimizer Summary */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-none bg-[#050505] border border-zinc-800 font-mono text-[11px]">
                            <div className="text-zinc-600">
                                <span className="text-zinc-200 font-semibold tabular-nums">
                                    {selectedWells.size}
                                </span>{" "}
                                WELLS SELECTED
                            </div>
                            <div className="text-zinc-600">
                                SIMULATED REDUCTION{" "}
                                <span className="text-emerald-500 font-semibold tabular-nums">
                                    {formatCurrency(simulatedSavings)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── EMPTY STATE ─────────────────────────────────────── */}
                {!data || data.totalLiability === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-3 rounded-none bg-[#050505] border border-zinc-800 mb-3">
                            <Calculator className="w-5 h-5 text-zinc-700" />
                        </div>
                        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-400 font-semibold mb-1">
                            NO LIABILITY DATA DETECTED
                        </h3>
                        <p className="font-mono text-[10px] text-zinc-600 max-w-sm leading-relaxed">
                            SEED AER DATA AND RUN THE DIRECTIVE 011 LIABILITY CALCULATION
                            FROM THE DATA ROOM TO SEE YOUR QUOTA HERE.
                        </p>
                        <a
                            href="/dashboard/data-room"
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase tracking-[0.15em] font-semibold hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors"
                        >
                            [ GO TO DATA ROOM ]
                            <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
