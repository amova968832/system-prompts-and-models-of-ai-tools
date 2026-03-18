import React, { useState } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface RegulationItem {
  id: string;
  code: string;
  title: string;
  jurisdiction: string;
  status: "compliant" | "pending" | "violation" | "under_review";
  lastAudit: string;
  riskScore: number;
  category: string;
}

interface AuditLogEntry {
  ts: string;
  level: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  module: string;
  message: string;
  actor: string;
}

interface MetricCard {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  unit?: string;
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const REGULATIONS: RegulationItem[] = [
  { id: "REG-0041", code: "GDPR-A17", title: "Right to Erasure Compliance", jurisdiction: "EU", status: "compliant", lastAudit: "2026-03-14T08:22:00Z", riskScore: 12, category: "DATA PRIVACY" },
  { id: "REG-0042", code: "SOX-302", title: "CEO/CFO Certification Controls", jurisdiction: "US", status: "pending", lastAudit: "2026-03-10T14:05:00Z", riskScore: 67, category: "FINANCIAL" },
  { id: "REG-0043", code: "HIPAA-164", title: "PHI Transmission Encryption", jurisdiction: "US", status: "violation", lastAudit: "2026-03-12T11:30:00Z", riskScore: 94, category: "HEALTHCARE" },
  { id: "REG-0044", code: "PCI-3.4", title: "Stored Cardholder Data Render", jurisdiction: "GLOBAL", status: "compliant", lastAudit: "2026-03-15T09:00:00Z", riskScore: 8, category: "PAYMENT" },
  { id: "REG-0045", code: "DORA-A5", title: "ICT Risk Mgmt Framework", jurisdiction: "EU", status: "under_review", lastAudit: "2026-03-08T16:45:00Z", riskScore: 51, category: "FINANCIAL" },
  { id: "REG-0046", code: "CCPA-1798", title: "Consumer Opt-Out Mechanism", jurisdiction: "US-CA", status: "compliant", lastAudit: "2026-03-13T07:15:00Z", riskScore: 15, category: "DATA PRIVACY" },
  { id: "REG-0047", code: "NIS2-A21", title: "Incident Reporting <24h", jurisdiction: "EU", status: "pending", lastAudit: "2026-03-09T12:00:00Z", riskScore: 73, category: "CYBERSECURITY" },
  { id: "REG-0048", code: "AI-ACT-52", title: "High-Risk AI System Audit", jurisdiction: "EU", status: "violation", lastAudit: "2026-03-11T10:20:00Z", riskScore: 88, category: "AI GOVERNANCE" },
  { id: "REG-0049", code: "GLBA-501", title: "Safeguards Rule Compliance", jurisdiction: "US", status: "compliant", lastAudit: "2026-03-14T13:40:00Z", riskScore: 22, category: "FINANCIAL" },
  { id: "REG-0050", code: "LGPD-A46", title: "DPO Appointment Verification", jurisdiction: "BR", status: "under_review", lastAudit: "2026-03-07T18:00:00Z", riskScore: 44, category: "DATA PRIVACY" },
];

const AUDIT_LOG: AuditLogEntry[] = [
  { ts: "2026-03-18T14:32:07Z", level: "CRITICAL", module: "SCAN-ENGINE", message: "PHI encryption gap detected in node us-east-2b — HIPAA-164 violation flag raised", actor: "SYS:AUTO-AUDIT" },
  { ts: "2026-03-18T14:31:55Z", level: "ERROR", module: "AI-GOV", message: "High-risk AI model v2.7.1 missing conformity assessment — AI-ACT-52 non-compliant", actor: "SYS:POLICY-CHK" },
  { ts: "2026-03-18T14:31:40Z", level: "WARN", module: "CERT-MGR", message: "SOX-302 certification window closes in 48h — pending CFO digital signature", actor: "ALERT:DEADLINE" },
  { ts: "2026-03-18T14:31:22Z", level: "INFO", module: "COMPLIANCE", message: "GDPR-A17 erasure workflow completed — 12,847 records purged across 3 data stores", actor: "OP:DATA-TEAM" },
  { ts: "2026-03-18T14:30:58Z", level: "WARN", module: "INCIDENT", message: "NIS2 reporting SLA at 18h/24h — escalation triggered to CISO", actor: "ALERT:SLA" },
  { ts: "2026-03-18T14:30:41Z", level: "INFO", module: "PAYMENT", message: "PCI-DSS quarterly scan passed — 0 findings on cardholder data stores", actor: "SYS:SCAN-PCI" },
  { ts: "2026-03-18T14:30:15Z", level: "INFO", module: "PRIVACY", message: "CCPA opt-out API health check nominal — avg response 42ms", actor: "SYS:HEALTH" },
  { ts: "2026-03-18T14:29:50Z", level: "WARN", module: "RISK-ENGINE", message: "Aggregate risk score elevated to 48.3 — threshold breach imminent at 50.0", actor: "SYS:RISK-CALC" },
  { ts: "2026-03-18T14:29:30Z", level: "INFO", module: "DPO-MGMT", message: "LGPD DPO appointment dossier submitted to ANPD — awaiting confirmation", actor: "OP:LEGAL" },
  { ts: "2026-03-18T14:29:10Z", level: "ERROR", module: "ICT-RISK", message: "DORA resilience test #RT-0094 failed on backup failover — retry scheduled", actor: "SYS:DORA-TEST" },
];

const METRICS: MetricCard[] = [
  { label: "TOTAL REGULATIONS", value: 247, delta: "+3", deltaType: "neutral", unit: "tracked" },
  { label: "COMPLIANCE RATE", value: "87.4%", delta: "-1.2%", deltaType: "negative" },
  { label: "ACTIVE VIOLATIONS", value: 6, delta: "+2", deltaType: "negative" },
  { label: "AVG RISK SCORE", value: 48.3, delta: "+4.1", deltaType: "negative" },
  { label: "PENDING REVIEWS", value: 14, delta: "-3", deltaType: "positive" },
  { label: "AUDIT QUEUE", value: 31, unit: "items" },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  compliant:    { label: "COMPLIANT",    dotClass: "bg-emerald-400", textClass: "text-emerald-400" },
  pending:      { label: "PENDING",      dotClass: "bg-amber-400",   textClass: "text-amber-400" },
  violation:    { label: "VIOLATION",    dotClass: "bg-rose-500",    textClass: "text-rose-500" },
  under_review: { label: "UNDER REVIEW", dotClass: "bg-cyan-400",    textClass: "text-cyan-400" },
} as const;

const LOG_LEVEL_CLASS = {
  INFO:     "text-zinc-500",
  WARN:     "text-amber-400",
  ERROR:    "text-rose-500",
  CRITICAL: "text-rose-400 font-bold",
} as const;

function formatTs(iso: string): string {
  return iso.replace("T", " ").replace("Z", "");
}

function riskColor(score: number): string {
  if (score >= 75) return "text-rose-500";
  if (score >= 50) return "text-amber-400";
  if (score >= 25) return "text-cyan-400";
  return "text-emerald-400";
}

function riskBarWidth(score: number): string {
  return `${Math.min(score, 100)}%`;
}

function riskBarColor(score: number): string {
  if (score >= 75) return "bg-rose-500";
  if (score >= 50) return "bg-amber-400";
  if (score >= 25) return "bg-cyan-400";
  return "bg-emerald-400";
}

// ─── NAVIGATION TABS ────────────────────────────────────────────────────────
type TabId = "overview" | "regulations" | "audit_log" | "risk_matrix";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",    label: "OVERVIEW" },
  { id: "regulations", label: "REGULATIONS" },
  { id: "audit_log",   label: "AUDIT LOG" },
  { id: "risk_matrix", label: "RISK MATRIX" },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function ReguMateDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // ── Metric Cards ────────────────────────────────────────────────────────
  const MetricStrip = () => (
    <div className="grid grid-cols-6 gap-px bg-zinc-800">
      {METRICS.map((m) => (
        <div key={m.label} className="bg-[#111] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1">
            {m.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg text-zinc-100 leading-none">
              {m.value}
            </span>
            {m.unit && (
              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                {m.unit}
              </span>
            )}
            {m.delta && (
              <span
                className={`font-mono text-[11px] ${
                  m.deltaType === "negative"
                    ? "text-rose-500"
                    : m.deltaType === "positive"
                    ? "text-emerald-400"
                    : "text-zinc-500"
                }`}
              >
                {m.delta}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Regulation Table ────────────────────────────────────────────────────
  const RegulationTable = () => (
    <div className="bg-[#111] border border-zinc-800 rounded-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
          REGULATION REGISTRY
        </span>
        <span className="font-mono text-[10px] text-zinc-600">
          {REGULATIONS.length} ENTRIES
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800">
              {["ID", "CODE", "TITLE", "JURISDICTION", "CATEGORY", "STATUS", "RISK", "LAST AUDIT"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {REGULATIONS.map((r) => {
              const st = STATUS_MAP[r.status];
              const isSelected = selectedRow === r.id;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRow(isSelected ? null : r.id)}
                  className={`border-b border-zinc-900 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-cyan-500/5 border-l-2 border-l-cyan-500"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-400">
                    {r.id}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-cyan-400 font-semibold">
                    {r.code}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-300 max-w-[260px] truncate">
                    {r.title}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                    {r.jurisdiction}
                  </td>
                  <td className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                    {r.category}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                      <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${st.textClass}`}>
                        {st.label}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-zinc-800 rounded-none overflow-hidden">
                        <div
                          className={`h-full ${riskBarColor(r.riskScore)}`}
                          style={{ width: riskBarWidth(r.riskScore) }}
                        />
                      </div>
                      <span className={`font-mono text-[11px] ${riskColor(r.riskScore)}`}>
                        {r.riskScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                    {formatTs(r.lastAudit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Audit Log ───────────────────────────────────────────────────────────
  const AuditLog = () => (
    <div className="bg-[#111] border border-zinc-800 rounded-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
          LIVE AUDIT STREAM
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-[0.15em]">
            STREAMING
          </span>
        </span>
      </div>
      <div className="divide-y divide-zinc-900">
        {AUDIT_LOG.map((entry, i) => (
          <div
            key={i}
            className="px-3 py-2 flex items-start gap-3 hover:bg-white/[0.015] transition-colors"
          >
            <span className="font-mono text-[11px] text-zinc-600 whitespace-nowrap shrink-0 w-[148px]">
              {formatTs(entry.ts)}
            </span>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.15em] w-[68px] shrink-0 ${
                LOG_LEVEL_CLASS[entry.level]
              }`}
            >
              {entry.level}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-cyan-400/70 w-[90px] shrink-0">
              {entry.module}
            </span>
            <span className="font-mono text-[11px] text-zinc-300 leading-tight flex-1 min-w-0">
              {entry.message}
            </span>
            <span className="font-mono text-[10px] text-zinc-600 whitespace-nowrap shrink-0">
              {entry.actor}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Risk Matrix (Compact Heat View) ─────────────────────────────────────
  const RiskMatrix = () => {
    const categories = [...new Set(REGULATIONS.map((r) => r.category))];
    const jurisdictions = [...new Set(REGULATIONS.map((r) => r.jurisdiction))];
    return (
      <div className="bg-[#111] border border-zinc-800 rounded-sm">
        <div className="px-3 py-2 border-b border-zinc-800">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            RISK HEAT MATRIX — CATEGORY × JURISDICTION
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-semibold">
                  CATEGORY
                </th>
                {jurisdictions.map((j) => (
                  <th
                    key={j}
                    className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-semibold text-center"
                  >
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat} className="border-b border-zinc-900">
                  <td className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold whitespace-nowrap">
                    {cat}
                  </td>
                  {jurisdictions.map((jur) => {
                    const match = REGULATIONS.find(
                      (r) => r.category === cat && r.jurisdiction === jur
                    );
                    if (!match) {
                      return (
                        <td key={jur} className="px-3 py-2 text-center">
                          <span className="font-mono text-[10px] text-zinc-800">—</span>
                        </td>
                      );
                    }
                    return (
                      <td key={jur} className="px-3 py-2 text-center">
                        <div
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-sm font-mono text-[11px] font-semibold ${
                            match.riskScore >= 75
                              ? "bg-rose-500/15 text-rose-500"
                              : match.riskScore >= 50
                              ? "bg-amber-400/15 text-amber-400"
                              : match.riskScore >= 25
                              ? "bg-cyan-400/10 text-cyan-400"
                              : "bg-emerald-400/10 text-emerald-400"
                          }`}
                        >
                          {match.riskScore}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Compliance Donut Summary (text-based) ───────────────────────────────
  const ComplianceSummary = () => {
    const counts = {
      compliant: REGULATIONS.filter((r) => r.status === "compliant").length,
      pending: REGULATIONS.filter((r) => r.status === "pending").length,
      violation: REGULATIONS.filter((r) => r.status === "violation").length,
      under_review: REGULATIONS.filter((r) => r.status === "under_review").length,
    };
    const total = REGULATIONS.length;
    return (
      <div className="bg-[#111] border border-zinc-800 rounded-sm">
        <div className="px-3 py-2 border-b border-zinc-800">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            STATUS DISTRIBUTION
          </span>
        </div>
        <div className="p-3 space-y-2">
          {(Object.entries(counts) as [keyof typeof STATUS_MAP, number][]).map(
            ([key, count]) => {
              const st = STATUS_MAP[key];
              const pct = ((count / total) * 100).toFixed(1);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                      <span className={`text-[10px] uppercase tracking-[0.15em] ${st.textClass}`}>
                        {st.label}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {count}/{total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full ${st.dotClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  };

  // ── Segmented Progress Bar (Global Compliance) ──────────────────────────
  const GlobalComplianceBar = () => {
    const segments = [
      { pct: 40, color: "bg-emerald-400" },
      { pct: 27.4, color: "bg-emerald-400/50" },
      { pct: 14, color: "bg-amber-400" },
      { pct: 12, color: "bg-rose-500" },
      { pct: 6.6, color: "bg-rose-500/50" },
    ];
    return (
      <div className="bg-[#111] border border-zinc-800 rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            GLOBAL COMPLIANCE INDEX
          </span>
          <span className="font-mono text-[11px] text-emerald-400">87.4%</span>
        </div>
        <div className="flex h-1.5 gap-px">
          {segments.map((s, i) => (
            <div
              key={i}
              className={`${s.color} rounded-none`}
              style={{ width: `${s.pct}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {["FULL", "PARTIAL", "PENDING", "VIOLATION", "CRITICAL"].map((l) => (
            <span
              key={l}
              className="text-[9px] uppercase tracking-[0.15em] text-zinc-600"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-zinc-300 antialiased">
      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-none" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-semibold">
              REGUMATE AI
            </span>
          </div>
          <span className="text-[10px] text-zinc-700">|</span>
          <span className="font-mono text-[10px] text-zinc-600">
            REGULATORY INTELLIGENCE PLATFORM v3.2.1
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-[0.15em]">
              SYSTEMS NOMINAL
            </span>
          </span>
          <span className="text-[10px] text-zinc-700">|</span>
          <span className="font-mono text-[10px] text-zinc-600">
            {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
          </span>
        </div>
      </header>

      {/* ── TAB NAV ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-0 bg-[#0a0a0a] border-b border-zinc-800 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-cyan-400 border-cyan-500"
                : "text-zinc-600 border-transparent hover:text-zinc-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── METRIC STRIP ─────────────────────────────────────────────────── */}
      <MetricStrip />

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="p-2 space-y-2">
        {activeTab === "overview" && (
          <>
            <GlobalComplianceBar />
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <RegulationTable />
              </div>
              <div className="space-y-2">
                <ComplianceSummary />
                <div className="bg-[#111] border border-zinc-800 rounded-sm">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
                      RECENT AUDIT EVENTS
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-900">
                    {AUDIT_LOG.slice(0, 5).map((entry, i) => (
                      <div key={i} className="px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                              LOG_LEVEL_CLASS[entry.level]
                            }`}
                          >
                            {entry.level}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-700">
                            {formatTs(entry.ts).slice(11)}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-zinc-400 leading-tight truncate">
                          {entry.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "regulations" && <RegulationTable />}
        {activeTab === "audit_log" && <AuditLog />}
        {activeTab === "risk_matrix" && <RiskMatrix />}
      </main>

      {/* ── FOOTER / STATUS BAR ──────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] border-t border-zinc-800">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-zinc-600">
            NODE: <span className="text-zinc-400">US-EAST-1</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            CLUSTER: <span className="text-zinc-400">PROD-A</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            LATENCY: <span className="text-emerald-400">12ms</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-zinc-600">
            SCAN CYCLE: <span className="text-amber-400">14/31</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            NEXT AUDIT: <span className="text-zinc-400">2026-03-18T15:00Z</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-700">
            © REGUMATE AI — ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>
    </div>
  );
}
