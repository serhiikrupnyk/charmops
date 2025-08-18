"use client";

import { useEffect, useState, use } from "react";

/** Серверні коди стану інвайту, які ми мапимо у UI */
type State = "ok" | "invalid" | "expired" | "used";

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Next.js 15 / React 19: розгортаємо проміс із параметрами маршруту
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<State>("ok");
  const [email, setEmail] = useState<string>("");

  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [password, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>();

  // Перевірити інвайт за токеном
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/invites/${token}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (cancelled) return;
        setLoading(false);
        if (!res.ok) {
          setState((j?.code as State) || "invalid");
          return;
        }
        setEmail(j.email);
        setState("ok");
      } catch {
        if (!cancelled) {
          setLoading(false);
          setState("invalid");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Прийняти інвайт → створити акаунт
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(undefined);
    setSubmitting(true);
    const res = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, password }),
    });
    const j = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setErr(j?.error || "Не вдалося створити акаунт");
      return;
    }
    // після успішного прийняття — на логін
    window.location.href = "/login?m=invited";
  };

  /* =================== UI =================== */

  if (loading) {
    return (
      <Wrapper>
        <Card>
          <CardHeader
            title="Перевіряємо інвайт…"
            subtitle="Будь ласка, зачекайте кілька секунд."
          />
          <div className="mt-4 grid gap-3">
            <SkeletonLine />
            <SkeletonLine className="w-2/3" />
            <SkeletonLine className="w-1/2" />
          </div>
        </Card>
      </Wrapper>
    );
  }

  if (state !== "ok") {
    return (
      <Wrapper>
        <Card>
          <CardHeader title="Проблема з інвайтом" />
          <div className="mt-3 rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {state === "invalid" && "Посилання інвайту некоректне."}
            {state === "expired" && "Термін дії цього інвайту минув."}
            {state === "used" && "Цей інвайт уже використано."}
          </div>
          <div className="mt-5">
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Повернутись до входу
            </a>
          </div>
        </Card>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Card>
        <CardHeader
          title="Прийняття запрошення"
          subtitle={
            <>
              Email: <b className="text-slate-900">{email}</b>
            </>
          }
        />
        <form onSubmit={submit} className="mt-5 grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Label>
              Ім’я
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={firstName}
                onChange={(e) => setFirst(e.target.value)}
                required
                autoFocus
              />
            </Label>
            <Label>
              Прізвище
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={lastName}
                onChange={(e) => setLast(e.target.value)}
                required
              />
            </Label>
          </div>

          <Label>
            Пароль
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={password}
              onChange={(e) => setPass(e.target.value)}
              required
              minLength={8}
              placeholder="Мінімум 8 символів"
            />
          </Label>

          {err && (
            <div className="rounded-2xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {err}
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600/90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {submitting ? (
                <>
                  <IconSpinner className="animate-spin" /> Створюємо…
                </>
              ) : (
                "Створити акаунт"
              )}
            </button>
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Уже маєте акаунт?
            </a>
          </div>
        </form>
      </Card>
    </Wrapper>
  );
}

/* =================== Дрібні компоненти =================== */

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-white/80 backdrop-blur shadow-sm p-5">
      {children}
    </div>
  );
}

function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm text-slate-800">{children}</label>;
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-3 rounded bg-slate-200/80 ${className}`} />
  );
}

/* =================== Іконки =================== */

function IconSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
