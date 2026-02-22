"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import { login, signup, signInWithGoogle } from "./actions";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold aurora-text">
            Axel Pick
          </h1>
          <p className="mt-2 text-text-secondary">
            Fantasy Figure Skating
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card p-8 shadow-lg border border-black/5">
          <h2 className="font-display text-xl font-semibold mb-6">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>

          {/* Error / Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
              {message}
            </div>
          )}

          {/* Google OAuth */}
          <form action={() => {
            track("login", { method: "google" });
            return signInWithGoogle();
          }}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs text-text-secondary">or</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          {/* Email/Password Form */}
          <form action={(formData) => {
            track(mode === "login" ? "login" : "signup", { method: "email" });
            return mode === "login" ? login(formData) : signup(formData);
          }} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-1 block text-sm font-medium"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-emerald focus:ring-1 focus:ring-emerald"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-emerald focus:ring-1 focus:ring-emerald"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-emerald focus:ring-1 focus:ring-emerald"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-medium text-emerald hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-medium text-emerald hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
