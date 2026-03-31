"use client";

import { useEffect, useState } from "react";
import { VenueIncentive, fetchActiveIncentive, createIncentive, updateIncentive } from "@vibecheck/shared";

interface IncentivePanelProps {
  venueId: string;
  token: string;
}

export function IncentivePanel({ venueId, token }: IncentivePanelProps) {
  const [incentive, setIncentive] = useState<VenueIncentive | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchActiveIncentive(venueId)
      .then(setIncentive)
      .catch(() => setIncentive(null))
      .finally(() => setLoading(false));
  }, [venueId]);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const created = await createIncentive(
        { venueId, title: title.trim(), description: description.trim(), expiresAt: expiresAt || undefined },
        token,
      );
      setIncentive(created);
      setShowForm(false);
      setTitle("");
      setDescription("");
      setExpiresAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save incentive");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!incentive) return;
    setSaving(true);
    try {
      const updated = await updateIncentive(incentive.id, { active: false }, token);
      setIncentive(updated.active ? updated : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate incentive");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-zinc-800 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Venue Incentive</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
          >
            {incentive ? "Replace" : "Add incentive"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : incentive ? (
        <div className="rounded-lg bg-zinc-800 p-3 space-y-1">
          <p className="text-sm font-semibold text-zinc-100">{incentive.title}</p>
          <p className="text-xs text-zinc-400">{incentive.description}</p>
          {incentive.expiresAt && (
            <p className="text-xs text-zinc-500">
              Expires: {new Date(incentive.expiresAt).toLocaleString()}
            </p>
          )}
          <button
            onClick={handleDeactivate}
            disabled={saving}
            className="mt-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Deactivate"}
          </button>
        </div>
      ) : !showForm ? (
        <p className="text-sm text-zinc-500">No active incentive. Add one to reward guests who check in.</p>
      ) : null}

      {showForm && (
        <div className="space-y-2 rounded-lg bg-zinc-800/50 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. R50 off drinks)"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g. Valid till 10pm at the bar)"
            rows={2}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none resize-none"
          />
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Expiry (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
