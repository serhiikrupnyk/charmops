"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ============ Types ============ */
type Row = {
  id: number;
  name: string;
  email: string;
  role: "operator";
  profilesCount: number;
  online: boolean;
  stats: { replies: number; avgReplySec: number; replyRatePct: number };
};

export default function OperatorsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();

  // для кнопки "Оновити", щоб не збивати інтервал опитування
  const [refreshing, setRefreshing] = useState(false);

  // memo: відсортований список (імена по алфавіту)
  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.name.localeCompare(b.name)),
    [rows]
  );

  useEffect(() => {
    let abort = false;
    let t: number | undefined;

    const load = async () => {
      const res = await fetch("/api/operators", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (abort) return;
      if (!res.ok) {
        setErr(data?.error || "Не вдалося отримати список операторів");
      } else {
        setRows((data.operators as Row[]) ?? []);
      }
      t = window.setTimeout(load, 20_000); // 🔁 опитування кожні 20с
    };

    setLoading(true);
    load().finally(() => setLoading(false));

    return () => {
      abort = true;
      if (t) window.clearTimeout(t);
    };
  }, []);

  const manualRefresh = async () => {
    setRefreshing(true);
    setErr(undefined);
    try {
      const res = await fetch("/api/operators", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.error || "Не вдалося оновити");
      } else {
        setRows((data.operators as Row[]) ?? []);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Заголовок сторінки */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Оператори</h1>
          <p className="text-sm text-slate-600">
            Моніторинг активності та метрик відповіді в реальному часі.
          </p>
        </div>

        <button
          onClick={manualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/70 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
          title="Оновити список"
        >
          <IconRefresh className={refreshing ? "animate-spin" : ""} />
          Оновити
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Таблиця в картці */}
      <div className="rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-200/60 font-semibold text-slate-900">
          Список
        </div>

        <div className="relative max-w-full overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-50/70 backdrop-blur border-b border-indigo-200/60">
              <tr className="text-slate-600">
                <Th>Оператор</Th>
                <Th>Email</Th>
                <Th className="text-center">Онлайн</Th>
                <Th className="text-center">Анкет</Th>
                <Th className="text-center">Reply rate</Th>
                <Th className="text-center">Avg reply</Th>
                <Th className="text-right"></Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/70">
              {loading ? (
                <SkeletonRows />
              ) : sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-600"
                  >
                    Немає операторів
                  </td>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-indigo-50/40 transition-colors"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} />
                        <div className="leading-tight">
                          <div className="font-medium text-slate-900">
                            {r.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            #{r.id}
                          </div>
                        </div>
                      </div>
                    </Td>

                    <Td className="text-slate-800">{r.email}</Td>

                    <Td className="text-center">
                      <OnlineBadge online={r.online} />
                    </Td>

                    <Td className="text-center">
                      <span className="inline-flex items-center rounded-lg border border-slate-300 px-2 py-0.5 text-[12px] text-slate-700 bg-white/70">
                        {r.profilesCount}
                      </span>
                    </Td>

                    <Td className="text-center">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] bg-indigo-100 text-indigo-800">
                        {formatPct(r.stats.replyRatePct)}
                      </span>
                    </Td>

                    <Td className="text-center">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] bg-slate-100 text-slate-800">
                        {formatAvg(r.stats.avgReplySec)}
                      </span>
                    </Td>

                    <Td className="text-right">
                      <Link
                        href={`/operators/${r.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <IconOpen />
                        Відкрити
                      </Link>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ Helpers ============ */
function formatPct(v: number) {
  // 0-100 -> "64%" (без зайвих знаків, але акуратно округлено)
  if (Number.isFinite(v)) return `${Math.round(v)}%`;
  return "—";
}
function formatAvg(sec: number) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  const z = rest.toString().padStart(2, "0");
  return m > 0 ? `${m}:${z}` : `${s}s`;
}

/* ============ Small UI Bits ============ */
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
  return <td className={`px-4 py-2.5 ${className}`}>{children}</td>;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
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

/* ============ Fancy Bits ============ */
function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => {
    const parts = (name || "").trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || "").join("");
  }, [name]);

  return (
    <div className="relative">
      <div className="h-9 w-9 rounded-full bg-indigo-600 text-white grid place-items-center text-[12px] font-semibold shadow-sm">
        {initials || "OP"}
      </div>
    </div>
  );
}

function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span
      title={online ? "Онлайн" : "Офлайн"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] ${
        online
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        aria-hidden
        className={`h-2.5 w-2.5 rounded-full ${
          online ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      {online ? "online" : "offline"}
    </span>
  );
}

/* ============ Icons (outline, soft) ============ */
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
function IconOpen(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path
        d="M14 3h7v7M21 3l-9 9"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="4.5"
        y="6.5"
        width="9"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}
