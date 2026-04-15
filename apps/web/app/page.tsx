import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";

const APK_DOWNLOAD_URL =
  "https://github.com/ytgTonz/vibecheck/releases/download/apk-latest/app-release.apk";

const pillars = [
  {
    eyebrow: "Live Discovery",
    title: "See the room before you spend the Uber.",
    body: "Watch live streams from venues around you and decide where to go with actual real-time context instead of stale posts.",
  },
  {
    eyebrow: "Venue Teams",
    title: "Owners and promoters broadcast the signal.",
    body: "The people linked to the venue control what gets streamed, keeping the feed tied to real venues instead of random user uploads.",
  },
  {
    eyebrow: "Watch Anywhere",
    title: "Live, real-time, and made for tonight.",
    body: "VibeCheck is built around live streaming that tells you whether the place is warm, packed, or worth skipping — right now.",
  },
];

const onboardingSteps = [
  "Pick account type",
  "Create your account",
  "Start exploring live venues",
];


const marketingGallery = [
  {
    src: "/marketing/placeholders/hero-venue-stream.png",
    alt: "Phone filming a live DJ set",
    title: "Stream the moment",
    caption: "Go live in seconds and let your crowd pull people off the fence.",
  },
  {
    src: "/marketing/placeholders/crowd-energy.png",
    alt: "Energetic crowd and lights",
    title: "Feel the room",
    caption: "Real-time energy — no photos, no filters, just the honest vibe.",
  },
  {
    src: "/marketing/placeholders/venue-exterior.png",
    alt: "Venue exterior at night",
    title: "Own your night",
    caption: "Your venue, your story. Show the world what they're missing.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-red/20 blur-[120px]" />
        <div className="absolute right-[-120px] top-[220px] h-[340px] w-[340px] rounded-full bg-purple-600/20 blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-100px] left-[-60px] h-[280px] w-[280px] rounded-full bg-orange-500/20 blur-[120px] animate-pulse [animation-delay:300ms]" />
      </div>

      <section className="relative isolate overflow-hidden border-b border-zinc-800/80">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image
            src="/marketing/placeholders/hero-venue-stream.png"
            alt=""
            fill
            priority
            className="object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,45,85,0.32),transparent_36%),radial-gradient(circle_at_85%_22%,rgba(191,255,0,0.16),transparent_28%),linear-gradient(125deg,rgba(8,8,11,0.96)_12%,rgba(8,8,11,0.88)_54%,rgba(8,8,11,0.96)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:58px_58px] opacity-20" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,460px)] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-red/80">
              Live Nightlife, In Real Time
            </p>

            <h1 className="mt-4 max-w-4xl font-bebas text-6xl tracking-widest sm:text-7xl lg:text-8xl">
              <span className="text-zinc-100">DON&apos;T GUESS.</span>{" "}
              <span className="text-brand-red">WATCH FIRST.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Pick a venue with confidence. VibeCheck shows live streams from real nightlife
              spots so your team can decide in minutes, not after wasting a whole night.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
            <a
                href={APK_DOWNLOAD_URL}
                className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              >
                Download Android APK
              </a>
              <Link
                href="/login?mode=register&accountType=viewer"
                className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90"
              >
                Create free viewer account
              </Link>
              <Link
                href="/login?mode=register&accountType=owner"
                className="rounded-full border border-zinc-600 bg-zinc-900/80 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-400 hover:bg-zinc-900"
              >
                Register as venue owner
              </Link>
              <Link
                href="/browse"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Browse live venues
              </Link>
              
            </div>

            <div className="mt-5 text-sm text-zinc-400">
              New here? Start in under 60 seconds. No invite code needed for viewer accounts.
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex min-h-[68px] items-center rounded-2xl border border-zinc-800/90 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300"
                >
                  <span className="mr-2 text-brand-red">{index + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center overflow-hidden rounded-[2rem] border border-zinc-700/80 bg-[linear-gradient(155deg,#111113_5%,#27160f_52%,#0a0a0d_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute right-[-24px] top-[-24px] h-32 w-32 rounded-full bg-brand-red/30 blur-3xl" />
            <div className="pointer-events-none absolute left-[-14%] top-[38%] h-64 w-64 rounded-full bg-purple-500/25 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-28%] right-[-8%] h-56 w-56 rounded-full bg-brand-red/20 blur-[95px]" />
            <HeroCarousel />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Visual Storytelling
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for real venues, real nights, real energy.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
            Give your venue a live-first storefront. When owners stream the room in real time, viewers decide faster—and your busiest nights get busier.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {marketingGallery.map((item) => (
            <article
              key={item.src}
              className="overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-900/70"
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={1200}
                height={900}
                className="h-52 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-base font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Why It Exists
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Live discovery, anchored around venues.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
            VibeCheck brings the immediacy of live streaming to venue discovery, keeping the
            experience venue-first so the product still helps people choose a place, not just watch random content.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/70 p-6"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-red/70">
                {pillar.eyebrow}
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                {pillar.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-t border-zinc-800">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image
            src="/marketing/placeholders/crowd-energy.png"
            alt=""
            fill
            className="object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(9,9,11,0.95)_8%,rgba(9,9,11,0.82)_52%,rgba(9,9,11,0.95)_100%)]" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Ready To Explore
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Create your account and check the vibe before you pull up.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login?mode=register&accountType=viewer"
              className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90"
            >
              Sign up as viewer
            </Link>
            <Link
              href="/login?mode=register&accountType=owner"
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
            >
              Register your venue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
