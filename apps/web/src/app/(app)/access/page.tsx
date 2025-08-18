"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

/* ================= Types aligned with /api/invites ================= */
type InviteRow = {
  id: number;
  email: string;
  role: "admin" | "operator";
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdByUserId: number;
  createdAt: string;
  // client-only derived:
  status: "active" | "accepted" | "expired";
};

export default function AccessPage() {
  const { data: session } = useSession();
  const role = (session as any)?.role as
    | "super_admin"
    | "admin"
    | "operator"
    | undefined;

  const [list, setList] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [roleToInvite, setRoleToInvite] = useState<"admin" | "operator">(
    "operator"
  );
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | undefined>();
  const [lastLink, setLastLink] = useState<string | undefined>();

  const canInviteAdmin = role === "super_admin";
  const roleOptions = useMemo(() => {
    const base = [{ value: "operator", label: "Оператор" } as const];
    return canInviteAdmin
      ? ([{ value: "admin", label: "Адмін" } as const, ...base] as const)
      : base;
  }, [canInviteAdmin]);

  const APP_ORIGIN =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  /* ================= Helpers ================= */
  const computeStatus = (r: {
    usedAt: string | null;
    expiresAt: string | null;
  }): InviteRow["status"] => {
    if (r.usedAt) return "accepted";
    if (r.expiresAt && new Date(r.expiresAt).getTime() < Date.now())
      return "expired";
    return "active";
  };

  const withStatus = (rows: any[]): InviteRow[] =>
    rows.map((r) => ({
      ...r,
      status: computeStatus(r),
    }));

  const fmt = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString() : "—";

  /* ================= Data ================= */
  const load = async () => {
    setLoading(true);
    setError(undefined);
    const res = await fetch("/api/invites", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "Не вдалось отримати інвайти");
      return;
    }
    setList(withStatus(data.invites || []).sort((a, b) => b.id - a.id));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= Actions ================= */
  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setCreating(true);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: roleToInvite }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(data?.error || "Помилка створення інвайту");
      return;
    }
    const inv = data.invite as {
      id: number;
      email: string;
      role: "admin" | "operator";
      token: string;
      expiresAt: string;
      usedAt: string | null;
      createdByUserId: number;
      createdAt: string;
    };

    // Посилання показуємо лише зараз (у відповіді GET його нема)
    const link = `${APP_ORIGIN}/invite/${inv.token}`;
    setLastLink(link);

    setEmail("");
    // оновлюємо список локально (зі статусом)
    setList((prev) => {
      const updated = { ...inv, status: computeStatus(inv) };
      const idx = prev.findIndex((r) => r.id === inv.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;                 // оновлюємо існуючий запис з цим id
        return next.sort((a, b) => b.id - a.id);
      }
      return [updated, ...prev].sort((a, b) => b.id - a.id); // або додаємо, якщо нового id не було
    });
  };

  const onCopyLink = async () => {
    if (!lastLink) return;
    try {
      await navigator.clipboard.writeText(lastLink);
      alert("Посилання скопійовано!");
    } catch {
      alert("Не вдалося скопіювати. Скопіюйте вручну: " + lastLink);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Доступи / Інвайти
        </h1>
        <p className="text-sm text-slate-600">
          Супер-адмін може запрошувати <b>адмінів</b> та <b>операторів</b>. Адмін — лише{" "}
          <b>операторів</b>.
        </p>
      </div>

      {/* Create Invite Card */}
      <section className="rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Створити інвайт</h2>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/70 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Оновити список"
          >
            <IconRefresh />
            Оновити
          </button>
        </div>

        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email для запрошення
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Роль
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={roleToInvite}
              onChange={(e) => setRoleToInvite(e.target.value as any)}
            >
              {roleOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              disabled={creating}
              className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600/90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {creating ? (
                <span className="inline-flex items-center gap-2">
                  <IconSpinner className="animate-spin" /> Створення…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <IconPlus /> Створити
                </span>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {lastLink && (
          <div className="mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50 p-3">
            <div className="text-sm text-emerald-900">
              Інвайт створено. Посилання (видно тільки зараз):
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-lg bg-emerald-100/50 px-2 py-1 text-[13px] text-emerald-900">
                {lastLink}
              </code>
              <button
                onClick={onCopyLink}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/70 px-3 py-1.5 text-sm text-emerald-900 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <IconCopy /> Скопіювати
              </button>
            </div>
          </div>
        )}
      </section>

      {/* List Card */}
      <section className="rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-200/60">
          <h3 className="font-semibold text-slate-900">Список інвайтів</h3>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/70 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <IconRefresh /> Оновити
          </button>
        </div>

        <div className="relative max-w-full overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-50/70 backdrop-blur border-b border-indigo-200/60">
              <tr className="text-slate-600">
                <Th>ID</Th>
                <Th>Email</Th>
                <Th>Роль</Th>
                <Th>Статус</Th>
                <Th>Запросив</Th>
                <Th>Створено</Th>
                <Th>Діє до</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {loading ? (
                <SkeletonRows />
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-600">
                    Поки немає інвайтів
                  </td>
                </tr>
              ) : (
                list.map((r) => {
                  const statusBadge =
                    r.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : r.status === "accepted"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700";

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-indigo-50/40 transition-colors"
                    >
                      <Td>#{r.id}</Td>
                      <Td className="font-medium text-slate-900">{r.email}</Td>
                      <Td className="capitalize">{r.role}</Td>
                      <Td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${statusBadge}`}
                        >
                          <StatusDot status={r.status} />
                          {r.status}
                        </span>
                      </Td>
                      <Td>#{r.createdByUserId}</Td>
                      <Td>{fmt(r.createdAt)}</Td>
                      <Td>{fmt(r.expiresAt)}</Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ================= Small UI Bits ================= */
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left px-4 py-2.5 font-medium ${className}`}>{children}</th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-2.5 text-slate-800 ${className}`}>{children}</td>;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3 w-full rounded bg-slate-200/80" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function StatusDot({ status }: { status: InviteRow["status"] }) {
  const cls =
    status === "active"
      ? "bg-emerald-500"
      : status === "accepted"
        ? "bg-blue-500"
        : "bg-amber-500";
  return <span aria-hidden className={`h-2 w-2 rounded-full ${cls}`} />;
}

/* ================= Icons ================= */
function IconSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}
function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66M20 5v5h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
