"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore, fetchNotifications } from "@vibecheck/shared";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 10-4 0 2 2 0 004 0zM5 16a2 2 0 10-4 0 2 2 0 004 0z" />
      </svg>
    ),
  },
  {
    label: "Venues",
    href: "/admin/venues",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const sectionMeta: Record<string, { title: string; description: string }> = {
  "/admin": { title: "Overview", description: "Monitor key platform metrics and current live activity." },
  "/admin/feedback": { title: "Feedback", description: "Review quality signals, bug reports, and product requests." },
  "/admin/users": { title: "Users", description: "Moderate accounts, roles, and account-level operations." },
  "/admin/venues": { title: "Venues", description: "Manage venues, ownership, and promoter relationships." },
  "/admin/notifications": { title: "Notifications", description: "Track system notifications and mark important updates." },
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [accessState, setAccessState] = useState<"checking" | "unauthenticated" | "forbidden" | "allowed">("checking");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { hydrate(); setHydrated(true); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      setAccessState("unauthenticated");
      const t = window.setTimeout(() => router.replace("/login"), 1200);
      return () => window.clearTimeout(t);
    }
    if (user.role !== "ADMIN") {
      setAccessState("forbidden");
      const t = window.setTimeout(() => router.replace("/"), 1200);
      return () => window.clearTimeout(t);
    }
    setAccessState("allowed");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (accessState !== "allowed" || !token) return;
    fetchNotifications(token, { unreadOnly: true })
      .then((res) => setUnreadCount(res.total))
      .catch(() => {});
  }, [accessState, token]);

  if (!hydrated || accessState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  if (accessState === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-base font-semibold text-white">Sign in required</p>
          <p className="mt-2 text-sm text-zinc-400">Redirecting to login&hellip;</p>
        </div>
      </div>
    );
  }

  if (accessState === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-amber-900/40 bg-zinc-900 p-8 text-center">
          <p className="text-base font-semibold text-white">Admin access required</p>
          <p className="mt-2 text-sm text-zinc-400">Your account does not have permission to view this area.</p>
          <p className="mt-4 text-xs text-zinc-500">Redirecting&hellip;</p>
        </div>
      </div>
    );
  }

  const displayName = user?.name || user?.email || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();
  const currentMeta = Object.entries(sectionMeta).find(([k]) => isActive(pathname, k))?.[1] ?? sectionMeta["/admin"];

  return (
    <div className="flex min-h-[calc(100vh-57px)] bg-zinc-950 text-zinc-100">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">

          {/* User identity */}
          <div className="mb-5 flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-100">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
              <p className="text-[11px] text-zinc-500">Admin</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col gap-0.5">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <span className={`shrink-0 transition-colors ${active ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.label === "Notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-brand-red px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: back to app */}
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <Link
              href="/"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to app</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobile pill nav */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 px-4 py-3 lg:hidden">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {item.label}
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="rounded-full bg-brand-red px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Page header */}
        <div className="border-b border-zinc-800/60 px-6 py-5">
          <h1 className="text-xl font-semibold text-zinc-100">{currentMeta.title}</h1>
          <p className="mt-0.5 text-sm text-zinc-400">{currentMeta.description}</p>
        </div>

        {/* Page content */}
        <main className="flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
