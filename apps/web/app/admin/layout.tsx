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
  { label: "Clips", href: "/admin/clips" },
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

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
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
