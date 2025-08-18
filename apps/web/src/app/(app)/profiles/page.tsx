"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/* =================== Типи =================== */

type Profile = {
  id: number;
  platform: "sofiadate" | "sakuradate";
  login: string;
  displayName: string;
  status: "active" | "paused" | "banned" | "archived";
  lastSyncedAt: string | null;
  assignedOperatorId: number | null;
  assignedOperatorName: string | null;
};

type Operator = {
  id: number;
  name: string;
  email: string;
};

/* =================== Сторінка =================== */

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();

  const [platform, setPlatform] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [assigned, setAssigned] = useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(undefined);
    const qs = new URLSearchParams();
    if (platform !== "all") qs.set("platform", platform);
    if (status !== "all") qs.set("status", status);
    if (assigned !== "all") qs.set("assigned", assigned);
    const res = await fetch(`/api/profiles?${qs.toString()}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data?.error || "Не вдалося отримати анкети");
      return;
    }
    setProfiles(data.profiles as Profile[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, status, assigned]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold text-slate-900">Анкети</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <IconPlus /> Створити анкету
        </button>
      </header>

      {/* Фільтри */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={platform}
          onChange={setPlatform}
          label="Платформа"
          items={[
            { value: "all", label: "Усі" },
            { value: "sofiadate", label: "SofiaDate" },
            { value: "sakuradate", label: "SakuraDate" },
          ]}
        />
        <Select
          value={status}
          onChange={setStatus}
          label="Статус"
          items={[
            { value: "all", label: "Усі" },
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "banned", label: "Banned" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <Select
          value={assigned}
          onChange={setAssigned}
          label="Призначення"
          items={[
            { value: "all", label: "Усі" },
            { value: "assigned", label: "Призначені" },
            { value: "unassigned", label: "Вільні" },
          ]}
        />
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <IconRefresh />
          Оновити
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Таблиця */}
      <div className="rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-200/60 font-semibold text-slate-900">
          Реєстр анкет
        </div>

        <div className="relative max-w-full overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-50/70 backdrop-blur border-b border-indigo-200/60 text-slate-600">
              <tr>
                <Th>Платформа</Th>
                <Th>Логін</Th>
                <Th>Ім’я</Th>
                <Th>Статус</Th>
                <Th>Призначено</Th>
                <Th>Останній sync</Th>
                <Th className="text-right"></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-600">
                    Завантаження…
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-600">
                    Немає анкет
                  </td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                    <Td className="uppercase tracking-wide text-slate-700">{p.platform}</Td>
                    <Td className="font-medium text-slate-900">{p.login}</Td>
                    <Td className="text-slate-800">{p.displayName}</Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                    <Td className="text-slate-700">{p.assignedOperatorName ?? "—"}</Td>
                    <Td className="text-slate-700">
                      {p.lastSyncedAt ? new Date(p.lastSyncedAt).toLocaleString() : "—"}
                    </Td>
                    <Td className="text-right">
                      <AssignButton profile={p} onChanged={load} />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} onCreated={load} />}
    </div>
  );
}

/* =================== Табличні атоми =================== */

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-5 py-2.5 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-2.5 ${className}`}>{children}</td>;
}

/* =================== Контроли =================== */

function Select({
  value,
  onChange,
  label,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  items: { value: string; label: string }[];
}) {
  return (
    <label className="text-sm flex items-center gap-2 rounded-2xl border border-indigo-200/70 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
      <span className="text-slate-700">{label}</span>
      <select
        className="min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {items.map((i) => (
          <option key={i.value} value={i.value}>
            {i.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: Profile["status"] }) {
  const map: Record<Profile["status"], { bg: string; text: string; label: string }> = {
    active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "active" },
    paused: { bg: "bg-amber-100", text: "text-amber-700", label: "paused" },
    banned: { bg: "bg-rose-100", text: "text-rose-700", label: "banned" },
    archived: { bg: "bg-slate-100", text: "text-slate-700", label: "archived" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

/* =================== Create Profile Modal (портал не потрібен) =================== */

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [platform, setPlatform] = useState<"sofiadate" | "sakuradate">("sofiadate");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [locale, setLocale] = useState("en");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "banned" | "archived">("active");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>();

  // заблокувати скрол фону
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(undefined);
    setSubmitting(true);
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, login, password, displayName, locale, avatarUrl, status }),
    });
    const j = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setErr(j?.error || "Помилка створення");
      return;
    }
    onClose();
    await onCreated();
  };

  // закриття по ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border border-indigo-200/70 bg-white/80 backdrop-blur shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-indigo-200/60 font-semibold text-slate-900">
          Створити анкету
        </div>

        <div className="p-5 grid gap-3">
          <Label>
            Платформа
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
            >
              <option value="sofiadate">SofiaDate</option>
              <option value="sakuradate">SakuraDate</option>
            </select>
          </Label>

          <Label>
            Логін
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </Label>

          <Label>
            Пароль (до платформи)
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Label>

          <Label>
            Ім’я для відображення
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Label>
              Locale
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
              />
            </Label>
            <Label>
              Avatar URL
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </Label>
          </div>

          <Label>
            Статус
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="banned">Banned</option>
              <option value="archived">Archived</option>
            </select>
          </Label>

          {err && <div className="rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
        </div>

        <div className="px-5 py-4 border-t border-indigo-200/60 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Скасувати
          </button>
          <button
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600/90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {submitting ? (
              <>
                <IconSpinner className="animate-spin" /> Створення…
              </>
            ) : (
              "Створити"
            )}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm text-slate-800">{children}</label>;
}

/* =================== Assign / Unassign (MODAL В ПОРТАЛІ) =================== */

function AssignButton({ profile, onChanged }: { profile: Profile; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <IconUserSwitch />
        {profile.assignedOperatorId ? "Змінити" : "Призначити"}
      </button>
      {open && <AssignModal profile={profile} onClose={() => setOpen(false)} onChanged={onChanged} />}
    </>
  );
}

function AssignModal({
  profile,
  onClose,
  onChanged,
}: {
  profile: Profile;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [ops, setOps] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | "none">(profile.assignedOperatorId ?? "none");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>();

  // завантаження операторів
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/operators", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setErr(data?.error || "Не вдалося завантажити операторів");
        return;
      }
      const list = (data.operators as any[]).map((o) => ({ id: o.id, name: o.name, email: o.email }));
      setOps(list);
    })();
  }, []);

  // блокування скролу фону + закриття по ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const save = async () => {
    setSubmitting(true);
    const body: any = { assignedOperatorId: selected === "none" ? null : selected };
    const res = await fetch(`/api/profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      alert(j?.error || "Не вдалося зберегти");
      return;
    }
    onClose();
    await onChanged();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-indigo-200/70 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-200/60 font-semibold text-slate-900 flex items-center justify-between">
          <span>Призначення оператора</span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Закрити"
          >
            <IconX />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {err && <div className="rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

          {loading ? (
            <div className="text-sm text-slate-600">Завантаження…</div>
          ) : (
            <label className="text-sm text-slate-800 w-full">
              <span className="block mb-1">Оберіть оператора</span>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={String(selected)}
                onChange={(e) => setSelected(e.target.value === "none" ? "none" : Number(e.target.value))}
              >
                <option value="none">— Не призначено —</option>
                {ops.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.email})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="px-5 py-4 border-t border-indigo-200/60 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-3 py-2 text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Скасувати
          </button>
          <button
            onClick={save}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600/90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {submitting ? (
              <>
                <IconSpinner className="animate-spin" /> Збереження…
              </>
            ) : (
              "Зберегти"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =================== Іконки (тонкі контури) =================== */

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
function IconSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function IconUserSwitch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path d="M15 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M18 7h3m0 0-2-2m2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
