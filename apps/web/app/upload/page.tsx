"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setBaseUrl, useAuthStore, fetchVenues, Venue } from "@vibecheck/shared";
import {
  compressVideo,
  shouldCompress,
  formatFileSize,
} from "../lib/compressVideo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

const MUSIC_GENRES = [
  "Afrobeats",
  "Amapiano",
  "R&B",
  "Hip Hop",
  "House",
  "Jazz",
  "Soul",
  "Kwaito",
  "Dancehall",
  "Other",
];

export default function UploadPage() {
  const router = useRouter();
  const { user, token, hydrate } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState("");
  const [musicGenre, setMusicGenre] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate auth from localStorage on mount
  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login");
    }
  }, [hydrated, user, router]);

  // Load venues for the dropdown
  useEffect(() => {
    fetchVenues().then(setVenues).catch(() => {});
  }, []);

  // Create a video preview URL when a file is selected
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type
    if (!selected.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    // Validate file size (100MB max)
    if (selected.size > 100 * 1024 * 1024) {
      setError("File size must be under 100MB");
      return;
    }

    setError(null);
    setCompressionInfo(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !venueId || !token) return;

    setError(null);
    let fileToUpload = file;

    // Compress if needed
    if (shouldCompress(file)) {
      setCompressing(true);
      setCompressProgress(0);
      setStatusText("Loading compressor...");

      try {
        const originalSize = file.size;
        setStatusText("Compressing video...");

        fileToUpload = await compressVideo(file, {
          maxResolution: 720,
          videoBitrate: "1M",
          onProgress: (pct) => setCompressProgress(pct),
        });

        const saved = originalSize - fileToUpload.size;
        const pctSaved = Math.round((saved / originalSize) * 100);
        setCompressionInfo(
          `Compressed: ${formatFileSize(originalSize)} → ${formatFileSize(fileToUpload.size)} (${pctSaved}% smaller)`
        );
      } catch (err) {
        console.error("Compression failed, uploading original:", err);
        setCompressionInfo("Compression skipped — uploading original file");
        fileToUpload = file;
      } finally {
        setCompressing(false);
      }
    }

    // Upload
    setUploading(true);
    setProgress(0);
    setStatusText("Uploading...");

    const formData = new FormData();
    formData.append("video", fileToUpload);
    formData.append("venueId", venueId);
    if (musicGenre) formData.append("musicGenre", musicGenre);
    if (caption.trim()) formData.append("caption", caption.trim());

    try {
      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error || `Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));

        xhr.open("POST", `${API_URL}/clips`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      // Redirect to the venue page to see the clip
      router.push(`/venues/${venueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setStatusText("");
    }
  };

  const busy = compressing || uploading;

  // Don't render until hydration is done
  if (!hydrated || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        &larr; Back
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">Upload a clip</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Video file picker */}
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Video</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-900 px-4 py-8 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-50"
          >
            {file ? (
              <span>
                {file.name}{" "}
                <span className="text-zinc-600">
                  ({formatFileSize(file.size)})
                </span>
              </span>
            ) : (
              "Click to select a video file"
            )}
          </button>
          {file && shouldCompress(file) && !compressionInfo && !busy && (
            <p className="mt-1 text-xs text-zinc-500">
              This video will be compressed before upload
            </p>
          )}
          {compressionInfo && (
            <p className="mt-1 text-xs text-green-400">{compressionInfo}</p>
          )}
        </div>

        {/* Video preview */}
        {preview && (
          <div className="overflow-hidden rounded-lg bg-black">
            <video
              src={preview}
              controls
              className="mx-auto max-h-64"
              playsInline
            />
          </div>
        )}

        {/* Venue selector */}
        <div>
          <label htmlFor="venue" className="mb-1 block text-sm text-zinc-400">
            Venue
          </label>
          <select
            id="venue"
            required
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select a venue</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Genre selector */}
        <div>
          <label htmlFor="genre" className="mb-1 block text-sm text-zinc-400">
            Music genre (optional)
          </label>
          <select
            id="genre"
            value={musicGenre}
            onChange={(e) => setMusicGenre(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select a genre</option>
            {MUSIC_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Caption */}
        <div>
          <label htmlFor="caption" className="mb-1 block text-sm text-zinc-400">
            Caption (optional)
          </label>
          <input
            id="caption"
            type="text"
            maxLength={120}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
            placeholder="What's the vibe?"
          />
          <p className="mt-1 text-xs text-zinc-600">{caption.length}/120</p>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Compression progress */}
        {compressing && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-400">
              <span>{statusText}</span>
              <span>{compressProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${compressProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-400">
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={busy || !file || !venueId}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {compressing
            ? "Compressing..."
            : uploading
              ? "Uploading..."
              : "Upload clip"}
        </button>
      </form>
    </div>
  );
}
