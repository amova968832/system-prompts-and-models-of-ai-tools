"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ChatSession, User } from "@/lib/types";
import {
    MessageSquarePlus,
    MessagesSquare,
    FolderOpen,
    ShieldCheck,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
    BarChart3,
    Droplets,
    Calculator,
    Bot,
    Flame,
} from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { t, setLocale } = useI18n();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const [user, setUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Fetch user profile and chat sessions
    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();
            if (!authUser) {
                router.push("/login");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", authUser.id)
                .single();

            if (profileError) {
                console.error("[Dashboard] Profile fetch error:", profileError);
            }

            if (profile) {
                setUser(profile as User);
                if (profile.preferred_language) {
                    setLocale(profile.preferred_language as "en" | "fr");
                }
                if (!profile.org_id) {
                    router.push("/onboarding");
                    return;
                }
            }

            // Get chat sessions via server API
            try {
                const sessionsRes = await fetch("/api/chat-sessions");
                if (sessionsRes.ok) {
                    const { sessions: chatSessions } = await sessionsRes.json();
                    if (chatSessions) {
                        setSessions(chatSessions as ChatSession[]);
                    }
                }
            } catch (err) {
                console.error("[Dashboard] Sessions fetch error:", err);
            }
        };

        fetchData();
    }, [supabase, router, setLocale]);

    const handleNewChat = useCallback(async () => {
        try {
            const response = await fetch("/api/chat-sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            if (!response.ok) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                    return;
                }
                alert(data.error || "Failed to create chat session");
                return;
            }

            if (data.session) {
                setSessions((prev) => [data.session as ChatSession, ...prev]);
                router.push(`/dashboard/chat/${data.session.id}`);
            }
        } catch (err) {
            console.error("[Dashboard] handleNewChat error:", err);
            alert("Network error — please try again");
        }
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    // =========================================
    // NEW: ReguMate AI Navigation
    // =========================================
    const navItems = [
        {
            icon: BarChart3,
            label: "Assessment",
            href: "/dashboard/assessment",
            active: pathname === "/dashboard/assessment",
        },
        {
            icon: Droplets,
            label: "Wells & Assets",
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            icon: Calculator,
            label: "2026 Quota",
            href: "/dashboard/quota",
            active: pathname === "/dashboard/quota",
        },
        {
            icon: FolderOpen,
            label: "Data Room",
            href: "/dashboard/data-room",
            active: pathname === "/dashboard/data-room",
        },
        {
            icon: Bot,
            label: "Regulatory Advisor",
            href: "/dashboard/chat",
            active: pathname?.startsWith("/dashboard/chat"),
        },
        {
            icon: ShieldCheck,
            label: "Admin",
            href: "/dashboard/admin",
            active: pathname?.startsWith("/dashboard/admin"),
        },
        {
            icon: Settings,
            label: "Settings",
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings",
        },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Header — ReguMate AI Branding */}
            <div className="px-3 py-3 flex items-center justify-between border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-none" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-semibold font-mono">
                        REGUMATE AI
                    </span>
                </div>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors hidden lg:block"
                    aria-label="Close sidebar"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* New Chat Button (for Regulatory Advisor) */}
            <div className="px-2 py-2">
                <Button
                    onClick={handleNewChat}
                    className="w-full gap-2 h-8 rounded-none bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] uppercase tracking-[0.15em] font-semibold font-mono hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors shadow-none"
                    id="new-chat-btn"
                >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    NEW ADVISORY
                </Button>
            </div>

            <Separator className="bg-zinc-800/60" />

            {/* Navigation */}
            <div className="px-2 py-2 space-y-px">
                {navItems.map((item) => (
                    <button
                        key={item.href}
                        onClick={() => {
                            router.push(item.href);
                            setMobileSidebarOpen(false);
                        }}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-none text-[10px] uppercase tracking-[0.15em] font-semibold font-mono w-full transition-colors ${
                            item.active
                                ? "text-cyan-400 bg-cyan-500/5 border-l-2 border-l-cyan-500"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-l-2 border-l-transparent"
                        }`}
                    >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                    </button>
                ))}
            </div>

            <Separator className="bg-zinc-800/60" />

            {/* Chat History */}
            <div className="flex-1 overflow-hidden">
                <div className="px-3 py-2">
                    <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.2em] font-mono">
                        RECENT SESSIONS
                    </span>
                </div>
                <ScrollArea className="flex-1 px-2">
                    <div className="space-y-px pb-4">
                        {sessions.length === 0 ? (
                            <p className="font-mono text-[10px] text-zinc-600 px-2.5 py-2">
                                NO ADVISORY SESSIONS
                            </p>
                        ) : (
                            sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => {
                                        router.push(
                                            `/dashboard/chat/${session.id}`
                                        );
                                        setMobileSidebarOpen(false);
                                    }}
                                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-none text-[11px] font-mono w-full text-left transition-colors ${
                                        pathname ===
                                        `/dashboard/chat/${session.id}`
                                            ? "text-cyan-400 bg-cyan-500/5 border-l-2 border-l-cyan-500"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-l-2 border-l-transparent"
                                    }`}
                                >
                                    <MessagesSquare className="w-3 h-3 shrink-0" />
                                    <span className="truncate leading-tight">
                                        {session.title}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Footer */}
            <div className="p-2 space-y-2">
                <Separator className="bg-zinc-800/60" />
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-none bg-[#111] text-emerald-400 text-[9px] font-mono uppercase tracking-[0.15em] font-semibold border border-zinc-800">
                    <Flame className="w-2.5 h-2.5" />
                    ALBERTA ENERGY · DIRECTIVE 088
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-none text-[10px] uppercase tracking-[0.15em] font-semibold font-mono w-full text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
                    id="logout-btn"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    {t("nav.logout")}
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex overflow-hidden bg-black">
            {/* Mobile menu button */}
            <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden fixed top-3 left-3 z-50 p-1.5 rounded-none bg-[#111] border border-zinc-800"
                aria-label="Toggle sidebar"
            >
                <Menu className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Mobile overlay */}
            {mobileSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/80"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:relative z-40 h-full bg-[#0a0a0a] border-r border-zinc-800
          transition-all duration-200 ease-in-out
          ${sidebarOpen ? "w-64" : "w-0 lg:w-0"}
          ${mobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
          ${!sidebarOpen && !mobileSidebarOpen ? "lg:-translate-x-full" : ""}
        `}
            >
                {sidebarContent}
            </aside>

            {/* Sidebar toggle for collapsed state */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="hidden lg:flex fixed top-3 left-3 z-30 p-1.5 rounded-none bg-[#111] border border-zinc-800 items-center justify-center hover:bg-white/[0.03] transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu className="w-4 h-4 text-zinc-400" />
                </button>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">{children}</main>
        </div>
    );
}
