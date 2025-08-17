"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  // 1) Хуки — на верхньому рівні
  const { status } = useSession(); // "loading" | "authenticated" | "unauthenticated"
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  // показати текст помилки з query-параметра, якщо він є
  useEffect(() => {
    if (errorParam) setErr("Невірний email або пароль");
  }, [errorParam]);

  // якщо вже автентифікований — редірект
  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace("/dashboard");
    }
  }, [status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (!res || res.error) {
        setErr("Невірний email або пароль");
        return;
      }
      window.location.assign(res.url ?? "/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  // 2) Стабільний лоадер, доки не "unauthenticated"
  if (status !== "unauthenticated") {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="text-sm text-slate-600">Завантаження…</div>
      </div>
    );
  }

  // 3) Рендер форми
  return (
    <div className="min-h-screen relative">
      {/* м’який фон */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-slate-100 to-white" />

      <div className="min-h-screen grid place-items-center px-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm rounded-3xl border border-slate-300 bg-white shadow-sm overflow-hidden"
          noValidate
        >
          {/* Header картки */}
          <div className="px-6 py-5 border-b border-slate-300 bg-gradient-to-b from-indigo-100 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">
                C
              </div>
              <div className="leading-tight">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                  Вхід у CharmOps
                </h1>
                <p className="text-xs text-slate-600">Продовжимо з місця, де зупинились</p>
              </div>
            </div>
          </div>

          {/* Body картки */}
          <div className="px-6 py-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                className={[
                  "w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900",
                  "placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  submitting ? "opacity-90" : "",
                ].join(" ")}
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={submitting}
                inputMode="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm text-slate-700">
                  Пароль
                </label>
                <Link href="/auth/forgot" className="text-xs text-indigo-700 hover:underline">
                  Забули пароль?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  className={[
                    "w-full px-4 py-3 pr-24 rounded-xl border border-slate-300 bg-white text-slate-900",
                    "placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    submitting ? "opacity-90" : "",
                  ].join(" ")}
                  placeholder="Ваш пароль"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={submitting}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200"
                  aria-pressed={showPwd}
                  tabIndex={-1}
                >
                  {showPwd ? "Приховати" : "Показати"}
                </button>
              </div>
            </div>

            {/* Повідомлення про помилку */}
            <div className="min-h-0" aria-live="polite" aria-atomic="true">
              {err && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  {err}
                </p>
              )}
            </div>

            <button
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:hover:bg-indigo-600 disabled:opacity-60 transition-colors"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" />
                </svg>
              )}
              {submitting ? "Вхід…" : "Увійти"}
            </button>

            <div className="text-center pt-1">
              <Link href="/" className="text-sm text-slate-700 hover:underline">
                ← На головну
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
