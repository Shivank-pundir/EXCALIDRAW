"use client";

import { useRouter } from "next/navigation";
import { Caveat, Inter } from "next/font/google";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function LandingPage() {
  const router = useRouter();

  return (
    <main
      className={`${inter.variable} ${caveat.variable} min-h-screen font-sans`}
      style={{
        backgroundColor: "#12172A",
        backgroundImage:
          "radial-gradient(circle, rgba(232,163,61,0.12) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#12172A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "#E8A33D" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2138"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>

            <span
              className="text-2xl leading-none"
              style={{
                color: "#F8F0DC",
                fontFamily: "var(--font-caveat)",
              }}
            >
              Sketchly
            </span>
          </button>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a
              href="#features"
              className="transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#use-cases"
              className="transition hover:text-white"
            >
              Use cases
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How it works
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/login")}
              className="rounded-[14px_4px_14px_4px] px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Log in
            </button>

            <button
              onClick={() => router.push("/signup")}
              className="rounded-[14px_4pxpx_14px_4px] px-4 py-2 text-sm font-semibold transition hover:brightness-110"
              style={{
                backgroundColor: "#E8A33D",
                color: "#1B2138",
              }}
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
          {/* Hero content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8A33D]/20 bg-[#E8A33D]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#E8A33D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              Real-time collaborative canvas
            </div>

            <h1
              className="mt-6 text-6xl leading-[0.9] sm:text-7xl lg:text-[82px]"
              style={{
                color: "#F8F0DC",
                fontFamily: "var(--font-caveat)",
              }}
            >
              A canvas
              <br />
              where ideas
              <br />
              <span style={{ color: "#E8A33D" }}>
                move together.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
              Sketchly is a real-time whiteboard where you can draw,
              chat, and collaborate with your team on the same canvas.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/signup")}
                className="rounded-[14px_4px_14px_4px] px-6 py-3 text-sm font-bold transition hover:brightness-110"
                style={{
                  backgroundColor: "#E8A33D",
                  color: "#1B2138",
                }}
              >
                Start sketching →
              </button>

              <button
                onClick={() => router.push("/login")}
                className="rounded-[14px_4px_14px_4px] border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
              >
                I have an account
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
              <span className="text-[#E8A33D]">✦</span>
              No installation. Create a room and start drawing.
            </div>
          </div>

          {/* Canvas preview */}
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-[28px] border p-1.5 shadow-2xl"
              style={{
                borderColor: "rgba(232,163,61,0.25)",
                backgroundColor: "#1A2035",
              }}
            >
              {/* Canvas */}
              <div
                className="relative h-[350px] overflow-hidden rounded-[22px] sm:h-[430px]"
                style={{
                  backgroundColor: "#F8F0DC",
                  backgroundImage:
                    "radial-gradient(circle, rgba(27,33,56,0.13) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              >
                {/* Browser-like top bar */}
                <div className="absolute left-0 right-0 top-0 flex h-10 items-center border-b border-[#1B2138]/10 bg-[#F8F0DC]/90 px-4">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1B2138]/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1B2138]/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1B2138]/20" />
                  </div>

                  <span className="ml-auto mr-auto text-[10px] font-semibold text-[#1B2138]/40">
                    sketchly / design-room
                  </span>
                </div>

                {/* Drawing */}
                <svg
                  viewBox="0 0 500 390"
                  className="absolute inset-0 h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Rectangle */}
                  <rect
                    x="60"
                    y="90"
                    width="145"
                    height="95"
                    rx="8"
                    fill="none"
                    stroke="#1B2138"
                    strokeWidth="3"
                  />

                  {/* Circle */}
                  <ellipse
                    cx="350"
                    cy="125"
                    rx="65"
                    ry="50"
                    fill="none"
                    stroke="#E8A33D"
                    strokeWidth="3.5"
                  />

                  {/* Connection */}
                  <path
                    d="M205 137 C250 105 295 105 285 125"
                    fill="none"
                    stroke="#1B2138"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Wavy line */}
                  <path
                    d="M65 250 C110 220 145 275 190 240 C230 210 270 270 315 235 C350 210 390 245 435 225"
                    fill="none"
                    stroke="#1B2138"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Arrow */}
                  <path
                    d="M100 320 L390 320"
                    stroke="#1B2138"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d="M378 312 L390 320 L378 328"
                    fill="none"
                    stroke="#1B2138"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Small text */}
                  <text
                    x="90"
                    y="125"
                    fill="#1B2138"
                    fontSize="15"
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    Idea
                  </text>

                  <text
                    x="326"
                    y="130"
                    fill="#1B2138"
                    fontSize="13"
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    Team
                  </text>
                </svg>

                {/* Maya cursor */}
                <div
                  className="absolute"
                  style={{
                    left: "62%",
                    top: "28%",
                  }}
                >
                  <svg
                    width="20"
                    height="24"
                    viewBox="0 0 20 24"
                    fill="none"
                  >
                    <path
                      d="M2 2L17.5 12L10.5 13.5L7 21L2 2Z"
                      fill="#1B2138"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>

                  <div className="absolute left-4 top-4 whitespace-nowrap rounded-md bg-[#1B2138] px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
                    Maya
                  </div>
                </div>

                {/* Alex cursor */}
                <div
                  className="absolute"
                  style={{
                    left: "21%",
                    top: "60%",
                  }}
                >
                  <svg
                    width="20"
                    height="24"
                    viewBox="0 0 20 24"
                    fill="none"
                  >
                    <path
                      d="M2 2L17.5 12L10.5 13.5L7 21L2 2Z"
                      fill="#E8A33D"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>

                  <div className="absolute left-4 top-4 whitespace-nowrap rounded-md bg-[#E8A33D] px-2 py-1 text-[10px] font-semibold text-[#1B2138] shadow-lg">
                    Alex
                  </div>
                </div>
              </div>
            </div>

            {/* Live indicator */}
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-zinc-500">
              <div className="flex -space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#12172A] bg-[#1B2138] text-[9px] font-bold text-white">
                  M
                </div>

                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#12172A] bg-[#E8A33D] text-[9px] font-bold text-[#1B2138]">
                  A
                </div>
              </div>

              <span>
                <span className="text-[#4ade80]">●</span>{" "}
                2 people drawing right now
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="features"
        className="border-y border-white/5 bg-white/[0.015]"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8A33D]">
              Everything in one room
            </span>

            <h2
              className="mt-3 text-5xl"
              style={{
                color: "#F8F0DC",
                fontFamily: "var(--font-caveat)",
              }}
            >
              Built for thinking out loud.
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              A simple canvas with the tools you need to turn an idea
              into something everyone can see.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-[#E8A33D]/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8A33D]/10 text-xl text-[#E8A33D]">
                ✎
              </div>

              <h3 className="mt-5 font-semibold text-white">
                Draw together
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Use pens, shapes, arrows, text, and more to turn
                your ideas into something visual.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-[#E8A33D]/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8A33D]/10 text-xl text-[#E8A33D]">
                ◉
              </div>

              <h3 className="mt-5 font-semibold text-white">
                See everyone live
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                See who's inside the room and watch their cursors
                move across the canvas in real time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-[#E8A33D]/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8A33D]/10 text-xl text-[#E8A33D]">
                ◇
              </div>

              <h3 className="mt-5 font-semibold text-white">
                Chat without leaving
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Talk with everyone in the room while keeping the
                canvas right in front of you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= USE CASES ================= */}
      <section
        id="use-cases"
        className="mx-auto max-w-6xl px-5 py-20 sm:px-8"
      >
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8A33D]">
              One canvas, many ideas
            </span>

            <h2
              className="mt-3 text-5xl"
              style={{
                color: "#F8F0DC",
                fontFamily: "var(--font-caveat)",
              }}
            >
              Whatever you&apos;re thinking,
              <br />
              put it on the canvas.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-500">
              Sketchly gives teams a simple place to explain,
              explore, plan, and build ideas together.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              "Brainstorming",
              "Planning",
              "Wireframes",
              "Diagrams",
              "Teaching",
              "Team discussions",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#E8A33D]/30 hover:bg-[#E8A33D]/[0.04]"
              >
                <span className="text-xs text-[#E8A33D]">
                  0{index + 1}
                </span>

                <p className="mt-8 text-sm font-semibold text-white">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className="border-y border-white/5 bg-white/[0.015]"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8A33D]">
            Simple by design
          </span>

          <h2
            className="mt-3 text-5xl"
            style={{
              color: "#F8F0DC",
              fontFamily: "var(--font-caveat)",
            }}
          >
            Three steps and you&apos;re drawing.
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create a room",
                body: "Give your room a name and get a blank canvas ready for your ideas.",
              },
              {
                step: "02",
                title: "Invite your team",
                body: "Share the room with your teammates so everyone can join the same canvas.",
              },
              {
                step: "03",
                title: "Draw and chat live",
                body: "Draw, move around, chat, and watch everyone's changes appear instantly.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span
                  className="text-5xl"
                  style={{
                    color: "#E8A33D",
                    fontFamily: "var(--font-caveat)",
                  }}
                >
                  {item.step}
                </span>

                <h3 className="mt-4 font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div
          className="relative overflow-hidden rounded-[28px] border border-[#E8A33D]/30 px-6 py-14 text-center sm:px-12"
          style={{ backgroundColor: "#F8F0DC" }}
        >
          {/* Decorative dots */}
          <div className="absolute left-8 top-8 h-2 w-2 rounded-full bg-[#E8A33D]" />
          <div className="absolute right-10 top-12 h-1.5 w-1.5 rounded-full bg-[#1B2138]/30" />
          <div className="absolute bottom-8 left-16 h-1.5 w-1.5 rounded-full bg-[#1B2138]/30" />

          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8A33D]">
            Your canvas is waiting
          </span>

          <h2
            className="mt-4 text-5xl sm:text-6xl"
            style={{
              color: "#1B2138",
              fontFamily: "var(--font-caveat)",
            }}
          >
            Start with a blank canvas.
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#5B6478]">
            Create a room, invite someone, and see what you can
            build together.
          </p>

          <button
            onClick={() => router.push("/signup")}
            className="mt-7 rounded-[14px_4px_14px_4px] px-7 py-3 text-sm font-bold transition hover:brightness-110"
            style={{
              backgroundColor: "#1B2138",
              color: "#F8F0DC",
            }}
          >
            Open a canvas →
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: "#E8A33D" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2138"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>

            <span
              className="text-lg leading-none"
              style={{
                color: "#F8F0DC",
                fontFamily: "var(--font-caveat)",
              }}
            >
              Sketchly
            </span>
          </button>

          <p className="text-xs text-zinc-600">
            Built for teams who think out loud.
          </p>

          <div className="flex gap-5 text-xs text-zinc-600">
            <a href="#features" className="transition hover:text-zinc-300">
              Features
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-zinc-300"
            >
              How it works
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}