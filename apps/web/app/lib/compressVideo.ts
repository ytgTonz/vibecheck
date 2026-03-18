import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

/** Load FFmpeg WASM (cached after first call). */
async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

  ffmpeg = new FFmpeg();

  if (onLog) {
    ffmpeg.on("log", ({ message }) => onLog(message));
  }

  // Load the core from unpkg CDN (avoids bundling the ~25MB WASM file)
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

export interface CompressOptions {
  /** Max width/height in pixels (default 720). */
  maxResolution?: number;
  /** Target video bitrate (default "1M" = 1 Mbps). */
  videoBitrate?: string;
  /** Progress callback: 0–100. */
  onProgress?: (percent: number) => void;
}

/**
 * Compress a video file using FFmpeg WASM.
 * - Scales down to maxResolution (keeping aspect ratio)
 * - Re-encodes to H.264 + AAC in MP4 container
 * - Returns the compressed file
 */
export async function compressVideo(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxResolution = 720,
    videoBitrate = "1M",
    onProgress,
  } = options;

  const ff = await getFFmpeg();

  // Listen for progress events
  if (onProgress) {
    ff.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp4";

  // Write the input file to FFmpeg's virtual filesystem
  await ff.writeFile(inputName, await fetchFile(file));

  // Compress: scale to fit within maxResolution, re-encode at target bitrate
  // -vf scale: scales so the larger dimension is maxResolution, keeps aspect ratio
  // -c:v libx264: H.264 codec (widely supported)
  // -b:v: target video bitrate
  // -c:a aac -b:a 128k: AAC audio at 128kbps
  // -movflags +faststart: enables progressive playback
  await ff.exec([
    "-i", inputName,
    "-vf", `scale='min(${maxResolution},iw)':min'(${maxResolution},ih)':force_original_aspect_ratio=decrease`,
    "-c:v", "libx264",
    "-preset", "fast",
    "-b:v", videoBitrate,
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ]);

  // Read the output file
  const data = await ff.readFile(outputName);

  // Clean up virtual filesystem
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  // Copy into a standard ArrayBuffer to satisfy strict TypeScript
  const uint8 = data as Uint8Array;
  const buffer = new Uint8Array(uint8.length);
  buffer.set(uint8);
  const blob = new Blob([buffer], { type: "video/mp4" });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".mp4"), {
    type: "video/mp4",
  });
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot) : ".mp4";
}

/**
 * Check if compression would be beneficial (file is large or not mp4).
 */
export function shouldCompress(file: File): boolean {
  // Compress if file is > 10MB or not mp4
  const isLarge = file.size > 10 * 1024 * 1024;
  const isNotMp4 = !file.type.includes("mp4");
  return isLarge || isNotMp4;
}

/** Format bytes as a human-readable string. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
