"use client";

import { useState } from "react";
import Link from "next/link";

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [err, setErr] = useState<string>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(undefined);
    setMsg(undefined);

    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, ...form }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(data?.error ?? "Помилка");
    } else {
      setMsg("Готово! Тепер увійдіть.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        {/* Лого/бренд */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">
            C
          </div>
          <div className="leading-tight text-center">
            <div className="font-semibold tracking-tight text-slate-900">CharmOps</div>
            <div className="text-[11px] text-indigo-700/70">Invite Acceptance</div>
          </div>
        </div>

        {/* Картка */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-indigo-200/70 bg-white/80 backdrop-blur shadow-sm p-6 space-y-4"
        >
          <h1 className="text-xl font-semibold text-center text-slate-900">
            Приєднатись до CharmOps
          </h1>

          {/* Ім’я */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ім’я</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white/90 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="Олексій"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                autoComplete="given-name"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <IconUser />
              </span>
            </div>
          </div>

          {/* Прізвище */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Прізвище</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white/90 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="Іваненко"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                autoComplete="family-name"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <IconUsers />
              </span>
            </div>
          </div>

          {/* Пароль */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Пароль</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-300 bg-white/90 pl-9 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="Мінімум 6 символів"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <IconLock />
              </span>
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                aria-label={showPass ? "Приховати пароль" : "Показати пароль"}
              >
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {/* Повідомлення */}
          {err && (
            <div className="rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          )}
          {msg && (
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {msg}{" "}
              <Link href="/login" className="underline hover:no-underline">
                Увійти →
              </Link>
            </div>
          )}

          {/* Кнопка */}
          <button
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600/90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <IconSpinner className="animate-spin" /> Створення...
              </span>
            ) : (
              "Створити акаунт"
            )}
          </button>

          {/* Повернутись */}
          <div className="pt-1 text-center">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-800">
              ← На головну
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ====== Іконки (outline, м’які) ====== */
function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="17.5" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}
function IconLock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}
function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
function IconEyeOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 12s3.6-6 10-6c2.2 0 4.1.6 5.6 1.5M22 12s-3.6 6-10 6c-2.2 0-4.1-.6-5.6-1.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
function IconSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
