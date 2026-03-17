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
            <div className="flex items-center justify-center h-full bg-zinc-950">
                <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
            </div>
        );
    }
    return (
        <div className="flex flex-col h-full overflow-y-auto bg-zinc-950">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-[1400px] mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                                <Calculator className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
                                    2026 Mandatory Closure Spend Calculator
                                </h1>
                                <p className="text-xs text-zinc-500">
                                    Live portfolio data — $750M industry-wide closure spend target
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-[1400px] mx-auto px-4 py-4 w-full space-y-4">
                {/* Info Banner */}
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-sky-500/5 border border-sky-500/10">
                    <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-sky-300/70 leading-relaxed">
                        <span className="text-sky-300 font-medium">
                            2026 Single-Rate Rule:
                        </span>{" "}
                        Every licensee pays a proportionate share based strictly on
                        inactive liability. The two-rate discount has been eliminated.
                        Select wells below to simulate planned closures and optimize
                        your spend.
                    </p>
                </div>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Liability */}
                    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                                TOTAL LIABILITY
                            </span>
                            <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                        </div>
                        <div className="text-xl font-bold text-zinc-100 tabular-nums">
                            {formatCompact(data?.totalLiability || 0)}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 tabular-nums">
                            Wells {formatCompact(data?.wellLiability || 0)} · Fac {formatCompact(data?.facilityLiability || 0)}
                        </p>
                    </div>
                    {/* 2026 Quota */}
                    <div className="rounded-lg bg-zinc-900 border border-emerald-500/15 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                                2026 QUOTA
                            </span>
                            <Target className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-xl font-bold text-emerald-400 tabular-nums">
                            {result ? formatCurrency(result.userQuota) : "—"}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1">
                            Mandatory closure spend
                        </p>
                    </div>
                    {/* Wells */}
                    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                                WELLS
                            </span>
                            <Droplets className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <div className="text-xl font-bold text-zinc-100 tabular-nums">
                            {data?.totalWells || 0}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 tabular-nums">
                            {data?.activeWells || 0} active · {data?.inactiveWells || 0} inactive
                        </p>
                    </div>
                    {/* Simulated Spend */}
                    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                                SIMULATED SPEND
                            </span>
                            <span className="text-[10px] text-zinc-600 tabular-nums font-mono">
                                {selectedWells.size} sel
                            </span>
                        </div>
                        <div className="text-xl font-bold text-amber-400 tabular-nums">
                            {formatCurrency(simulatedSavings + (parseFloat(actualSpend) || 0))}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1">
                            Closure + actual combined
                        </p>
                    </div>
                </div>
                {/* Actual Spend Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Actual Closure Spend to Date
                        </label>
                        <div className="relative">
                            <span className="text-xs text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 font-mono">$</span>
                            <input
                                type="number"
                                value={actualSpend}
                                onChange={(e) => setActualSpend(e.target.value)}
                                placeholder="0"
                                className="w-full pl-7 pr-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 tabular-nums font-mono placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-colors"
                                id="actual-spend-input"
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600">
                            Abandonment, reclamation, and remediation spend for 2026
                        </p>
                    </div>
                </div>
                {/* Results */}
                {result && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {/* Progress Bar Card */}
                        <div className="rounded-lg bg-zinc-900 border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                                        Quota Progress
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-zinc-500 tabular-nums">
                                    {formatCurrency(
                                        (parseFloat(actualSpend) || 0) + simulatedSavings
                                    )}{" "}
                                    / {formatCurrency(result.userQuota)}
                                </span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${Math.min(result.quotaPercentComplete, 100)}%`,
                                        background:
                                            result.quotaPercentComplete >= 100
                                                ? "linear-gradient(90deg, #10b981, #34d399)"
                                                : result.quotaPercentComplete >= 50
                                                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                                  : "linear-gradient(90deg, #ef4444, #f87171)",
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-500 tabular-nums font-mono">
                                    {result.quotaPercentComplete}%
                                </span>
                                <span
                                    className={`text-xs font-semibold tabular-nums ${
                                        result.surplus >= 0
                                            ? "text-emerald-400"
                                            : "text-rose-400"
                                    }`}
                                >
                                    {result.surplus >= 0 ? "Surplus +" : "Deficit "}
                                    {formatCurrency(Math.abs(result.surplus))}
                                </span>
                            </div>
                        </div>
                        {/* Detail Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                                        REMAINING
                                    </span>
                                    <DollarSign className="w-3.5 h-3.5 text-zinc-600" />
                                </div>
                                <div
                                    className={`text-xl font-bold tabular-nums ${
                                        result.surplus >= 0
                                            ? "text-emerald-400"
                                            : "text-amber-400"
                                    }`}
                                >
                                    {result.surplus >= 0
                                        ? formatCurrency(0)
                                        : formatCurrency(Math.abs(result.surplus))}
                                </div>
                            </div>
                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                                        SURPLUS / DEFICIT
                                    </span>
                                    {result.surplus >= 0 ? (
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                    )}
                                </div>
                                <div
                                    className={`text-xl font-bold tabular-nums ${
                                        result.surplus >= 0
                                            ? "text-emerald-400"
                                            : "text-rose-400"
                                    }`}
                                >
                                    {result.surplus >= 0 ? "+" : ""}
                                    {formatCurrency(result.surplus)}
                                </div>
                            </div>
                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                                        BANKED CREDIT
                                    </span>
                                    <Banknote className="w-3.5 h-3.5 text-zinc-600" />
                                </div>
                                <div
                                    className={`text-xl font-bold tabular-nums ${
                                        result.bankedCredit > 0
                                            ? "text-sky-400"
                                            : "text-zinc-600"
                                    }`}
                                >
                                    {formatCurrency(result.bankedCredit)}
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-1">
                                    {result.bankedCredit > 0
                                        ? "Eligible for 2027 banking"
                                        : "Surplus must exceed 20% of quota"}
                                </p>
                            </div>
                        </div>
                        {/* Formula Breakdown */}
                        <div className="rounded-lg bg-zinc-900/50 border border-white/5 p-3">
                            <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2.5">
                                CALCULATION BREAKDOWN
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 font-mono tabular-nums">
                                <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                                    {formatCurrency(result.userInactiveLiability)}
                                </span>
                                <span className="text-zinc-600">÷</span>
                                <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                                    {formatCurrency(result.industryTotalLiability)}
                                </span>
                                <span className="text-zinc-600">×</span>
                                <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                                    $750,000,000
                                </span>
                                <ArrowRight className="w-3 h-3 text-zinc-600" />
                                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                                    {formatCurrency(result.userQuota)}
                                </span>
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-2">
                                AER Bulletin 2025-27 — Single-rate framework. Industry total: $30B.
                            </p>
                        </div>
                    </div>
                )}
                {/* Interactive Optimizer Table */}
                {optimizerWells.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <h2 className="text-sm font-semibold text-zinc-100">
                                        Closure Optimizer
                                    </h2>
                                    <p className="text-[10px] text-zinc-500">
                                        Ranked by liability-reduction efficiency
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={selectAll}
                                    className="px-2.5 py-1 text-[10px] font-medium rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors border border-white/5"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="px-2.5 py-1 text-[10px] font-medium rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors border border-white/5"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div className="rounded-lg border border-zinc-800 overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[36px_1fr_100px_130px_130px_90px] gap-0 bg-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold border-b border-zinc-800">
                                <div className="px-2 py-2 flex items-center justify-center">
                                    <Check className="w-3 h-3" />
                                </div>
                                <div className="px-3 py-2">UWI</div>
                                <div className="px-3 py-2">Area</div>
                                <div className="px-3 py-2 text-right">Liability</div>
                                <div className="px-3 py-2 text-right">Est. Cost</div>
                                <div className="px-3 py-2 text-right">Eff.</div>
                            </div>
                            {/* Table Body */}
                            <div className="max-h-[360px] overflow-y-auto">
                                {optimizerWells.map((w) => {
                                    const isSelected = selectedWells.has(w.id);
                                    return (
                                        <div
                                            key={w.id}
                                            onClick={() => toggleWell(w.id)}
                                            className={`grid grid-cols-[36px_1fr_100px_130px_130px_90px] gap-0 text-xs cursor-pointer transition-colors border-b border-zinc-800/50 ${
                                                isSelected
                                                    ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                                                    : "bg-zinc-950 hover:bg-zinc-800/30"
                                            }`}
                                        >
                                            <div className="px-2 py-2 flex items-center justify-center">
                                                <div
                                                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? "bg-emerald-500 border-emerald-500"
                                                            : "border-zinc-700"
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-3 py-2 font-mono text-xs text-zinc-300 truncate">
                                                {w.uwi}
                                            </div>
                                            <div className="px-3 py-2 text-zinc-500 truncate font-mono text-xs">
                                                {w.area_code || "—"}
                                            </div>
                                            <div className="px-3 py-2 text-right text-zinc-200 tabular-nums">
                                                {formatCurrency(w.liability)}
                                            </div>
                                            <div className="px-3 py-2 text-right text-amber-400 tabular-nums">
                                                {formatCurrency(w.closureCost)}
                                            </div>
                                            <div className="px-3 py-2 text-right">
                                                <span
                                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
                                                        w.efficiency >= 1.25
                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                            : w.efficiency >= 1.0
                                                              ? "bg-amber-500/10 text-amber-400"
                                                              : "bg-zinc-800/50 text-zinc-500"
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
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900 border border-white/5 text-xs">
                            <div className="text-zinc-500">
                                <span className="text-zinc-200 font-semibold tabular-nums">
                                    {selectedWells.size}
                                </span>{" "}
                                wells selected
                            </div>
                            <div className="text-zinc-500">
                                Simulated reduction{" "}
                                <span className="text-emerald-400 font-semibold tabular-nums">
                                    {formatCurrency(simulatedSavings)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {/* Empty State */}
                {!data || data.totalLiability === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 mb-3">
                            <Calculator className="w-6 h-6 text-zinc-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-400 mb-1">
                            No liability data yet
                        </h3>
                        <p className="text-xs text-zinc-600 max-w-sm">
                            Seed AER data and run the Directive 011 liability calculation
                            from the Data Room to see your quota here.
                        </p>
                        <a
                            href="/dashboard/data-room"
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                        >
                            Go to Data Room
                            <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
