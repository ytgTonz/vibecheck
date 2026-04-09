"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@vibecheck/shared";

// Routes that render their own fullscreen UI — bypass the sidebar shell
const FULLSCREEN_PREFIXES = ["/dashboard/live/", "/dashboard/scan/"];

const sectionMeta: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Venue Dashboard",
    description: "Manage your venues, streams, and promoter teams.",
  },
  "/dashboard/new": {
    title: "Add Venue",
    description: "Register a new venue to your account.",
  },
  "/dashboard/edit": {
    title: "Edit Venue",
    description: "Update venue details and settings.",
  },
};

function getCurrentMeta(pathname: string) {
  if (pathname.startsWith("/dashboard/edit/")) return sectionMeta["/dashboard/edit"];
  return sectionMeta[pathname] ?? sectionMeta["/dashboard"];
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0">{children}</span>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  // Fullscreen routes: skip the layout shell entirely
  const isFullscreen = FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isFullscreen) return <>{children}</>;

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  const isOwner = user.role === "VENUE_OWNER" || user.role === "ADMIN";
  const displayName = user.name || user.email || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const meta = getCurrentMeta(pathname);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const navItems = [
    {
      label: "My Venues",
      href: "/dashboard",
      show: true,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: "Add Venue",
      href: "/dashboard/new",
      show: isOwner,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
  ];

  const secondaryItems = [
    {
      label: "Browse Live",
      href: "/browse",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-57px)] bg-zinc-950 text-zinc-100">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">

          {/* User identity */}
          <div className="mb-5 flex items-center gap-2.5 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-100">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
              <p className="text-[11px] text-zinc-500 capitalize">
                {user.role?.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
          </div>

          {/* Primary nav */}
          <nav className="flex flex-col gap-0.5">
            {navItems.filter((i) => i.show).map((item) => {
              const active = isActive(item.href);
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
                  <NavIcon>
                    <span className={`${active ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                      {item.icon}
                    </span>
                  </NavIcon>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Divider + secondary nav */}
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Discover
            </p>
            <nav className="flex flex-col gap-0.5">
              {secondaryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                >
                  <NavIcon>
                    <span className="text-zinc-500 group-hover:text-zinc-300">{item.icon}</span>
                  </NavIcon>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom: back to site */}
          <div className="mt-auto border-t border-zinc-800 pt-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to app</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobile top pill nav */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 px-4 py-3 lg:hidden">
          {navItems.filter((i) => i.show).map((item) => {
            const active = isActive(item.href);
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
              </Link>
            );
          })}
          <Link
            href="/browse"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            Browse Live
          </Link>
        </div>

        {/* Page header */}
        <div className="border-b border-zinc-800/60 px-6 py-5">
          <h1 className="text-xl font-semibold text-zinc-100">{meta.title}</h1>
          <p className="mt-0.5 text-sm text-zinc-400">{meta.description}</p>
        </div>

        {/* Page content */}
        <main className="flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
