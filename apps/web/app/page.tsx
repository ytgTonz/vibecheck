import Link from "next/link";

const APK_DOWNLOAD_URL =
  "https://github.com/ytgTonz/vibecheck/releases/latest/download/vibecheck-android.apk";

const pillars = [
  {
    eyebrow: "Live Discovery",
    title: "See the room before you spend the Uber.",
    body: "Watch live streams from venues around East London and decide where to go with actual real-time context instead of stale posts.",
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

const useCases = [
  "Watch what is happening live right now",
  "Compare multiple venues in minutes",
  "See real-time streams, not polished promos",
  "Broadcast straight from linked venue teams",
];

export default function LandingPage() {
  return (
    <main className="bg-zinc-950 text-zinc-100">
      <section className="border-b border-zinc-800">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,440px)] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200/80">
              East London Nightlife, In Real Time
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Know the vibe before you arrive.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              VibeCheck helps people answer one question quickly: where should I go tonight?
              Watch live venue streams and make the call with real-time signal instead of guesswork.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={APK_DOWNLOAD_URL}
                className="rounded-full bg-orange-300 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-200"
              >
                Download Android APK
              </a>
              <Link
                href="/browse"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Browse live venues
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-zinc-500">
              <span>Live venue streaming</span>
              <span>Owner and promoter broadcasting</span>
              <span>Built for tonight, not reviews from last month</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-[linear-gradient(160deg,#0f0f10_10%,#1f140f_45%,#09090b_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="mb-5 flex gap-1.5">
              <span className="h-1 flex-1 rounded-full bg-white/90" />
              <span className="h-1 flex-1 rounded-full bg-white/25" />
              <span className="h-1 flex-1 rounded-full bg-white/15" />
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200/80">
                What Browse Gives You
              </p>
              <h2 className="mt-4 text-2xl font-semibold">
                Live now. Offline if it is quiet.
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                The product is ranked around live activity. Streaming venues surface first,
                and every card takes you straight into the live feed.
              </p>

              <div className="mt-6 space-y-3">
                {useCases.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-200/70">
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

      <section className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Ready To Explore
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              See what is actually live tonight.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Open browse
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
            >
              Owner / promoter login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
