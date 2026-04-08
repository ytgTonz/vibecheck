"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore, fetchNotifications } from "@vibecheck/shared";

const tabs = [
  {
    label: "Overview",
    href: "/admin",
    icon: "OV",
    description: "Platform health and live activity",
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: "FB",
    description: "Bugs, ideas, and ratings",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: "US",
    description: "Accounts, roles, and moderation",
  },
  {
    label: "Venues",
    href: "/admin/venues",
    icon: "VN",
    description: "Ownership and venue lifecycle",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: "NT",
    description: "System events and inbox triage",
  },
];

const sectionMeta: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Overview",
    description: "Monitor key platform metrics and current live activity.",
  },
  "/admin/feedback": {
    title: "Feedback",
    description: "Review quality signals, bug reports, and product requests.",
  },
  "/admin/users": {
    title: "Users",
    description: "Moderate accounts, roles, and account-level operations.",
  },
  "/admin/venues": {
    title: "Venues",
    description: "Manage venues, ownership, and promoter relationships.",
  },
  "/admin/notifications": {
    title: "Notifications",
    description: "Track system notifications and mark important updates.",
  },
};

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [accessState, setAccessState] = useState<"checking" | "unauthenticated" | "forbidden" | "allowed">("checking");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      setAccessState("unauthenticated");
      const timeoutId = window.setTimeout(() => router.replace("/login"), 1200);
      return () => window.clearTimeout(timeoutId);
    }

    if (user.role !== "ADMIN") {
      setAccessState("forbidden");
      const timeoutId = window.setTimeout(() => router.replace("/"), 1200);
      return () => window.clearTimeout(timeoutId);
    }

    setAccessState("allowed");
  }, [hydrated, user, router]);

  // Fetch unread notification count for the badge
  useEffect(() => {
    if (accessState !== "allowed" || !token) return;
    fetchNotifications(token, { unreadOnly: true })
      .then((res) => setUnreadCount(res.total))
      .catch(() => {});
  }, [accessState, token]);

  if (!hydrated || accessState === "checking") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (accessState === "unauthenticated") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-lg font-semibold text-white">Sign in required</p>
          <p className="mt-2 text-sm text-zinc-400">
            Redirecting to the login page so you can access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (accessState === "forbidden") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-amber-900/40 bg-zinc-900 p-8 text-center">
          <p className="text-lg font-semibold text-white">Admin access required</p>
          <p className="mt-2 text-sm text-zinc-400">
            Your account is signed in, but it does not have permission to view this area.
          </p>
          <p className="mt-4 text-xs text-zinc-500">Redirecting to the main app.</p>
        </div>
      </div>
    );
  }

  const currentTab =
    tabs.find((tab) => isTabActive(pathname, tab.href)) ?? tabs[0];
  const currentSection = sectionMeta[currentTab.href] ?? sectionMeta["/admin"];
  const displayName = user?.name || user?.email || "Admin";

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">
              Admin Console
            </p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-100 sm:text-2xl">
              {currentSection.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{currentSection.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
              Unread:{" "}
              <span className="font-semibold text-zinc-100">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </div>
            <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
              {displayName}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
        <aside className="sticky top-24 hidden h-fit w-72 shrink-0 lg:block">
          <nav className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-2">
            {tabs.map((tab) => {
              const active = isTabActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${
                    active
                      ? "border border-zinc-700 bg-zinc-800 text-zinc-100"
                      : "border border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-800/70 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-semibold ${
                      active
                        ? "bg-zinc-100 text-zinc-900"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {tab.label}
                      {tab.label === "Notifications" && unreadCount > 0 && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {tab.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {tabs.map((tab) => {
              const active = isTabActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
                  }`}
                >
                  {tab.label}
                  {tab.label === "Notifications" && unreadCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
