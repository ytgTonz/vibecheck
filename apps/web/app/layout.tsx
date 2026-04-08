import type { Metadata } from "next";
import { Bebas_Neue, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import NotificationToast from "@/components/NotificationToast";
import { ToastProvider, ToastPortal } from "@/components/toast";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  weight: ["400", "600"],
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  variable: "--font-mono-brand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibeCheck — Feel the night",
  description:
    "Watch live venue streams and feel the vibe before you arrive.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bebasNeue.variable} ${sourceSerif4.variable} ${ibmPlexMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        <ToastProvider>
          <NavBar />
          <NotificationToast />
          <ToastPortal />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
