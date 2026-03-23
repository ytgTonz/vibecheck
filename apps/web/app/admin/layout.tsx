"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@vibecheck/shared";

const tabs = [
  { label: "Overview", href: "/admin" },
  { label: "Feedback", href: "/admin/feedback" },
  { label: "Users", href: "/admin/users" },
  { label: "Venues", href: "/admin/venues" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [accessState, setAccessState] = useState<"checking" | "unauthenticated" | "forbidden" | "allowed">("checking");

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Admin Panel</h1>

      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-zinc-800">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
