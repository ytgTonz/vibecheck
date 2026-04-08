"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateMyProfile, useAuthStore, useRequireAuth } from "@vibecheck/shared";

export default function AccountPage() {
  const router = useRouter();
  const { user, token, ready } = useRequireAuth((path) => router.replace(path));
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await updateMyProfile(token, { name });
      setUser(updatedUser);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none disabled:opacity-50";

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-40 rounded bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
      >
        &larr; Back
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">Account</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">
            Display name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            minLength={2}
            maxLength={60}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
            Email
          </label>
          <input id="email" type="email" value={user.email} disabled className={inputClass} />
          <p className="mt-1 text-xs text-zinc-500">Email changes are not available yet.</p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

