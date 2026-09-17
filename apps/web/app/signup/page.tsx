"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Caveat, Inter } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-caveat" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim() || !username.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:4000/signup",
        {
          name,
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

     const { token, user } = response.data;

localStorage.setItem("token", token);

if (user) {
  localStorage.setItem("user", JSON.stringify(user));
}

router.push("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message ||
            "Unable to connect to server"
        );
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`${inter.variable} ${caveat.variable} font-sans relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12`}
      style={{
        backgroundColor: "#12172A",
        backgroundImage:
          "radial-gradient(circle, rgba(232,163,61,0.16) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* soft glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full blur-[110px]"
        style={{ background: "rgba(232,163,61,0.22)" }}
      />

      <div
        className="relative w-full max-w-md animate-[rise_0.5s_ease-out] rounded-[28px_10px_28px_10px] p-9 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
        style={{
          backgroundColor: "#F8F0DC",
          border: "1.5px solid #1B2138",
          transform: "rotate(-0.6deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-[28px_10px_28px_10px]"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)" }}
          aria-hidden
        />

        <div className="relative mb-7 flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "#E8A33D" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1B2138"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>

          <div>
            <p
              className="text-3xl leading-none"
              style={{ fontFamily: "var(--font-caveat)", color: "#1B2138" }}
            >
              Let&apos;s start sketching
            </p>
            <p className="mt-1 text-sm" style={{ color: "#5B6478" }}>
              Create your account to save and share drawings
            </p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="relative space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "#1B2138" }}
            >
              Full name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ada Lovelace"
              className="w-full border-b-2 bg-transparent px-1 py-2 text-[15px] outline-none transition placeholder:text-[#9AA0AE] focus:border-[#E8A33D]"
              style={{ borderColor: "#C9BFA1", color: "#1B2138" }}
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "#1B2138" }}
            >
              Email address
            </label>

            <input
              id="username"
              type="email"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="you@example.com"
              className="w-full border-b-2 bg-transparent px-1 py-2 text-[15px] outline-none transition placeholder:text-[#9AA0AE] focus:border-[#E8A33D]"
              style={{ borderColor: "#C9BFA1", color: "#1B2138" }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "#1B2138" }}
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="w-full border-b-2 bg-transparent px-1 py-2 pr-10 text-[15px] outline-none transition placeholder:text-[#9AA0AE] focus:border-[#E8A33D]"
                style={{ borderColor: "#C9BFA1", color: "#1B2138" }}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-lg p-2 transition hover:opacity-70"
                style={{ color: "#5B6478" }}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 102.8 2.8" />
                    <path d="M9.9 4.2A10.8 10.8 0 0112 4c7 0 10 8 10 8a17.3 17.3 0 01-3.1 4.4" />
                    <path d="M6.6 6.6C3.9 8.4 2 12 2 12s3 8 10 8a10.8 10.8 0 004.1-.8" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="rounded-lg border px-4 py-3 text-sm"
              style={{
                borderColor: "rgba(225,91,79,0.4)",
                backgroundColor: "rgba(225,91,79,0.1)",
                color: "#B4392F",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[14px_4px_14px_4px] py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "#1B2138", color: "#F8F0DC" }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#2A3252";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1B2138";
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="relative mt-6 text-center text-sm" style={{ color: "#5B6478" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold transition"
            style={{ color: "#1B2138" }}
          >
            Log in
          </Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes rise {
          from {
            opacity: 0;
            transform: rotate(-0.6deg) translateY(14px);
          }
          to {
            opacity: 1;
            transform: rotate(-0.6deg) translateY(0);
          }
        }
      `}</style>
    </main>
  );
}