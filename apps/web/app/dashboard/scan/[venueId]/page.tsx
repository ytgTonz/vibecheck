"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth, fetchMyVenues, fetchQRToken, redeemQRToken, QRTokenPreview } from "@vibecheck/shared";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

type ScanState = "idle" | "previewing" | "redeeming" | "success" | "error";

const SCANNER_DIV_ID = "qr-reader";

export default function QRScannerPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const router = useRouter();
  const { user, token, hydrated, ready } = useRequireAuth((path) => router.replace(path));

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedToken, setScannedToken] = useState("");
  const [preview, setPreview] = useState<QRTokenPreview | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Check venue membership
  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    fetchMyVenues(token)
      .then((venues) => {
        if (cancelled) return;
        setAuthorized(venues.some((v) => v.id === venueId));
      })
      .catch(() => { if (!cancelled) setAuthorized(false); });
    return () => { cancelled = true; };
  }, [ready, token, venueId]);

  const stopCamera = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => null);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    const scanner = new Html5Qrcode(SCANNER_DIV_ID);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          // Stop immediately so we don't fire again while processing
          stopCamera();
          handleTokenInput(decoded);
        },
        () => { /* ignore per-frame decode failures */ },
      );
    } catch {
      setCameraError("Camera access denied. Use the manual input below.");
      setShowManual(true);
    }
  };

  // Start camera when idle; stop it when we move to any other state
  useEffect(() => {
    if (!ready || authorized !== true) return;

    if (scanState === "idle") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanState, ready, authorized]);

  const handleTokenInput = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setScannedToken(trimmed);
    setScanState("previewing");
    setErrorMessage(null);
    setPreview(null);

    try {
      const result = await fetchQRToken(trimmed);
      if (result.valid && result.venueId && result.venueId !== venueId) {
        setScanState("error");
        setErrorMessage("This QR code belongs to a different venue.");
        return;
      }
      setPreview(result);
    } catch {
      setScanState("error");
      setErrorMessage("Failed to look up that token. Check the code and try again.");
    }
  };

  const handleRedeem = async () => {
    if (!preview || !token || !scannedToken) return;
    setScanState("redeeming");
    try {
      const result = await redeemQRToken(scannedToken, token);
      setSuccessMessage(result.incentive ? `Redeemed — ${result.incentive.title}` : "Arrival confirmed");
      setScanState("success");
    } catch (err) {
      setScanState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to redeem QR code");
    }
  };

  const reset = () => {
    setScannedToken("");
    setPreview(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    setManualValue("");
    setScanState("idle");
  };

  if (!ready) return null;

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
        <div className="mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-xl font-semibold">Scanner unavailable</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You are not linked to this venue, so you cannot scan or redeem its guest QR codes.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-zinc-300 hover:text-white">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (authorized === null) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            ← Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-1">QR Check-in Scanner</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Point your camera at a guest&apos;s QR code to check them in.
        </p>

        {/* Camera viewfinder — visible only when idle */}
        {scanState === "idle" && (
          <div className="mb-6">
            <div
              id={SCANNER_DIV_ID}
              className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900"
            />
            {cameraError && (
              <p className="mt-2 text-xs text-red-400">{cameraError}</p>
            )}

            <button
              onClick={() => setShowManual((v) => !v)}
              className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
            >
              {showManual ? "Hide manual input" : "Enter token manually instead"}
            </button>

            {showManual && (
              <div className="mt-2 flex gap-2">
                <input
                  autoFocus
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTokenInput(manualValue); }}
                  placeholder="Paste or type token…"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
                <button
                  onClick={() => handleTokenInput(manualValue)}
                  disabled={!manualValue.trim()}
                  className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-40"
                >
                  Look up
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview state */}
        {scanState === "previewing" && preview && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-4">
            {preview.valid ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-sm font-semibold text-green-400">Valid QR code</span>
                </div>
                {preview.venueName && (
                  <p className="text-sm text-zinc-300">
                    Venue: <span className="font-medium text-zinc-100">{preview.venueName}</span>
                  </p>
                )}
                {preview.incentive && (
                  <div className="rounded-lg bg-zinc-800 px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-100">{preview.incentive.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{preview.incentive.description}</p>
                  </div>
                )}
                {preview.expiresAt && (
                  <p className="text-xs text-zinc-500">
                    Expires: {new Date(preview.expiresAt).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleRedeem}
                    className="flex-1 rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
                  >
                    Redeem
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-sm font-semibold text-red-400">
                    {preview.reason === "already_used" ? "Already redeemed" : "QR code expired"}
                  </span>
                </div>
                {preview.claimedAt && (
                  <p className="text-xs text-zinc-500">
                    Claimed at: {new Date(preview.claimedAt).toLocaleString()}
                  </p>
                )}
                <button onClick={reset} className="w-full rounded-lg bg-zinc-800 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700">
                  Scan next
                </button>
              </>
            )}
          </div>
        )}

        {/* Redeeming */}
        {scanState === "redeeming" && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-center">
            <p className="text-sm text-zinc-400">Redeeming…</p>
          </div>
        )}

        {/* Success */}
        {scanState === "success" && successMessage && (
          <div className="rounded-xl border border-green-800 bg-green-950/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <span className="text-sm font-semibold text-green-300">{successMessage}</span>
            </div>
            <button
              onClick={reset}
              className="w-full rounded-lg bg-zinc-800 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Scan next guest
            </button>
          </div>
        )}

        {/* Error */}
        {scanState === "error" && errorMessage && (
          <div className="rounded-xl border border-red-800 bg-red-950/20 p-5 space-y-3">
            <p className="text-sm text-red-400">{errorMessage}</p>
            <button
              onClick={reset}
              className="w-full rounded-lg bg-zinc-800 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
