"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type OperatorDetail = {
  id: number;
  email: string;
  name: string;
  role: "operator";
  online: boolean;
  lastPing: string | null;
  stats: { replies: number; avgReplySec: number; replyRatePct: number };
  profiles: {
    id: number;
    platform: string;
    login: string;
    displayName: string;
    status: string;
    lastSyncedAt: string | null;
  }[];
  activity: string[]; // ISO timestamps
};

type ProfileRow = OperatorDetail["profiles"][number];

export default function OperatorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [data, setData] = useState<OperatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "profiles" | "activity">("overview");
  const [err, setErr] = useState<string>();
  const [assignOpen, setAssignOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setErr(undefined);
    setLoading(true);
    const res = await fetch(`/api/operators/${id}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(json?.error || "Не вдалося отримати дані");
      return;
    }
    setData(json.operator as OperatorDetail);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Avatar name={data?.name ?? "Оператор"} />
          <div className="leading-tight">
            <h1 className="text-2xl font-semibold text-slate-900">{data?.name ?? "Оператор"}</h1>
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <span className="truncate">{data?.email ?? "—"}</span>
              <span className="inline-block h-1 w-1 rounded-full bg-slate-300" />
              <OnlineBadge online={!!data?.online} />
              {data?.lastPing && (
                <>
                  <span className="inline-block h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-xs">
                    Останній пінг: {new Date(data.lastPing).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAssignOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/70 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Призначити анкету"
          >
            <IconPlus />
            Призначити анкету
          </button>
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
          >
            <IconRefresh className={refreshing ? "animate-spin" : ""} />
            Оновити
          </button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={tab} onChange={setTab} />

      {err && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-600">Завантаження…</div>
      ) : !data ? (
        <div className="text-sm text-slate-600">Немає даних</div>
      ) : tab === "overview" ? (
        <Overview data={data} />
      ) : tab === "profiles" ? (
        <Profiles
          data={data}
          onUnassign={async (profileId) => {
            const res = await fetch(`/api/operators/${id}/unassign`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileId }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) {
              alert(j?.error || "Не вдалося зняти");
              return;
            }
            await load();
          }}
        />
      ) : (
        <ActivityList activity={data.activity} />
      )}

      {assignOpen && (
        <AssignModal
          operatorId={id}
          onClose={() => setAssignOpen(false)}
          onAssigned={async () => {
            setAssignOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

/* ================= Small atoms ================= */

function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => {
    const parts = (name || "").trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || "").join("");
  }, [name]);
  return (
    <div className="h-11 w-11 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-semibold shadow-sm">
      {initials || "OP"}
    </div>
  );
}

function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] ${
        online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        aria-hidden
        className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"}`}
      />
      {online ? "online" : "offline"}
    </span>
  );
}

/* ================= Tabs ================= */

function Tabs({
  value,
  onChange,
}: {
  value: "overview" | "profiles" | "activity";
  onChange: (v: "overview" | "profiles" | "activity") => void;
}) {
  const items: { key: typeof value; label: string; icon: JSX.Element }[] = [
    { key: "overview", label: "Огляд", icon: <IconGauge /> },
    { key: "profiles", label: "Анкети", icon: <IconFolder /> },
    { key: "activity", label: "Активність", icon: <IconPulse /> },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-1 rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur p-1 shadow-sm">
        {items.map((it) => {
          const active = value === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={[
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-indigo-50",
              ].join(" ")}
            >
              <span aria-hidden>{it.icon}</span>
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================ Overview ================ */

function Overview({ data }: { data: OperatorDetail }) {
  const s = data.stats;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Відповідей (сьогодні)"
        value={formatNum(s.replies ?? 0)}
        icon={<IconChat />}
      />
      <MetricCard
        title="Avg reply"
        value={formatAvg(s.avgReplySec)}
        icon={<IconClock />}
      />
      <MetricCard
        title="Reply rate"
        value={formatPct(s.replyRatePct)}
        icon={<IconRate />}
      />
      <MetricCard title="Анкет" value={String(data.profiles.length)} icon={<IconUsers />} />
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon: JSX.Element }) {
  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{title}</div>
        <div className="text-indigo-600">{icon}</div>
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

/* ================ Profiles ================ */

function Profiles({
  data,
  onUnassign,
}: {
  data: OperatorDetail;
  onUnassign: (profileId: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-indigo-200/60 font-semibold text-slate-900">
        Призначені анкети
      </div>
      <div className="relative max-w-full overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-indigo-50/70 backdrop-blur border-b border-indigo-200/60 text-slate-600">
            <tr>
              <Th>Платформа</Th>
              <Th>Логін</Th>
              <Th>Ім’я для відображення</Th>
              <Th>Статус</Th>
              <Th>Остання синхронізація</Th>
              <Th className="text-right"></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {data.profiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-600">
                  Немає анкет
                </td>
              </tr>
            ) : (
              data.profiles.map((p) => (
                <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                  <Td className="uppercase tracking-wide text-slate-700">{p.platform}</Td>
                  <Td className="font-medium text-slate-900">{p.login}</Td>
                  <Td className="text-slate-800">{p.displayName}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td className="text-slate-700">
                    {p.lastSyncedAt ? new Date(p.lastSyncedAt).toLocaleString() : "—"}
                  </Td>
                  <Td className="text-right">
                    <button
                      onClick={() => onUnassign(p.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <IconUnlink />
                      Зняти
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  // просте відображення статусів
  const map: Record<string, { bg: string; text: string; label?: string }> = {
    active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "active" },
    paused: { bg: "bg-amber-100", text: "text-amber-700", label: "paused" },
    error: { bg: "bg-rose-100", text: "text-rose-700", label: "error" },
  };
  const cls = map[status]?.bg ?? "bg-slate-100";
  const tx = map[status]?.text ?? "text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] ${cls} ${tx}`}>
      {map[status]?.label ?? status}
    </span>
  );
}

/* ================ Activity ================ */

function ActivityList({ activity }: { activity: string[] }) {
  if (!activity?.length)
    return <div className="text-sm text-slate-600">Ще немає активності</div>;

  return (
    <ul className="space-y-2">
      {activity.map((ts, i) => (
        <li
          key={i}
          className="rounded-xl border border-indigo-200/60 bg-white/70 backdrop-blur px-4 py-2 text-sm shadow-sm"
        >
          {new Date(ts).toLocaleString()}
        </li>
      ))}
    </ul>
  );
}

/* ================ Table atoms ================ */
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-5 py-2.5 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-2.5 ${className}`}>{children}</td>;
}

/* ================ Assign Modal ================ */
function AssignModal({
  operatorId,
  onClose,
  onAssigned,
}: {
  operatorId: number;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [err, setErr] = useState<string>();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profiles?assigned=unassigned&status=active", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setErr(data?.error || "Не вдалося отримати профілі");
        return;
      }
      setRows(data.profiles as ProfileRow[]);
    })();
  }, []);

  const assign = async () => {
    if (!selected) return;
    setSubmitting(true);
    const res = await fetch(`/api/operators/${operatorId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: selected }),
    });
    const j = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      alert(j?.error || "Не вдалося призначити");
      return;
    }
    await onAssigned();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-indigo-200/70 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-200/60 font-semibold text-slate-900 flex items-center justify-between">
          <span>Призначити анкету</span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Закрити"
          >
            <IconX />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {err && (
            <div className="rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-slate-600">Завантаження…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-slate-700">Немає доступних анкет</div>
          ) : (
            <div className="max-h-[50vh] overflow-auto rounded-xl border border-slate-300">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-indigo-50/70 backdrop-blur border-b border-slate-300 text-slate-600">
                  <tr>
                    <Th className="w-10"></Th>
                    <Th>Платформа</Th>
                    <Th>Логін</Th>
                    <Th>Ім’я</Th>
                    <Th>Останній sync</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-indigo-50/40 transition-colors">
                      <Td className="w-10">
                        <input
                          type="radio"
                          name="profile"
                          checked={selected === r.id}
                          onChange={() => setSelected(r.id)}
                          className="h-4 w-4 accent-indigo-600"
                        />
                      </Td>
                      <Td className="uppercase tracking-wide text-slate-700">{r.platform}</Td>
                      <Td className="font-medium text-slate-900">{r.login}</Td>
                      <Td className="text-slate-800">{r.displayName}</Td>
                      <Td className="text-slate-700">
                        {r.lastSyncedAt ? new Date(r.lastSyncedAt).toLocaleString() : "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-indigo-200/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Скасувати
          </button>
          <button
            onClick={assign}
            disabled={!selected || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600/90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {submitting ? (
              <>
                <IconSpinner className="animate-spin" /> Призначення…
              </>
            ) : (
              "Призначити"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Formatting ================= */
function formatNum(n: number) {
  try {
    return new Intl.NumberFormat().format(n ?? 0);
  } catch {
    return String(n ?? 0);
  }
}
function formatPct(v: number) {
  if (!Number.isFinite(v)) return "—";
  return `${Math.round(v)}%`;
}
function formatAvg(sec: number) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  const z = rest.toString().padStart(2, "0");
  return m > 0 ? `${m}:${z}` : `${s}s`;
}

/* ================= Icons (thin outline) ================= */
function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
function IconGauge(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path d="M4 14a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M12 14l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconFolder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <rect x="3" y="10" width="18" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
function IconPulse(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path
        d="M3 12h4l2-6 4 12 2-6h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
function IconChat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden="true">
      <path d="M4 5h16v10H7l-3 4V5Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconRate(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden="true">
      <path d="M4 16l4-4 4 4 6-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden="true">
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <circle cx="17.5" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}
function IconUnlink(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path d="M10 14L5 19M14 10l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 7l3-3a4.2 4.2 0 1 1 6 6l-1 1M17 17l-3 3a4.2 4.2 0 1 1-6-6l1-1"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}
function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
