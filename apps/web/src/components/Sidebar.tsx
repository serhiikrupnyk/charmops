"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { JSX } from "react";

type Role = "super_admin" | "admin" | "operator";
type Item = {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
};

const items: Item[] = [
  { href: "/dashboard",   label: "Дашборд",      icon: IconDashboard },
  { href: "/operators",   label: "Оператори",    icon: IconUsers },
  { href: "/profiles",    label: "Анкети",       icon: IconFolders },
  { href: "/chats",       label: "Чати",         icon: IconChat },
  { href: "/alerts",      label: "Алерти",       icon: IconAlert },
  { href: "/leaderboard", label: "Лідерборд",    icon: IconTrophy },
  { href: "/payouts",     label: "Виплати",      icon: IconCard },
  { href: "/settings",    label: "Налаштування", icon: IconSettings },
  { href: "/access",      label: "Доступи",      icon: IconShield },
];

// Які розділи доступні кожній ролі
const allowedByRole: Record<Role, Set<string>> = {
  super_admin: new Set(items.map((i) => i.href)), // усе
  admin: new Set([
    "/dashboard",
    "/operators",
    "/profiles",
    "/chats",
    "/alerts",
    "/leaderboard",
    "/payouts",
    "/settings",
    "/access", // створює інвайти тільки для операторів (бек уже перевіряє)
  ]),
  operator: new Set([
    "/dashboard",
    "/chats",
    "/alerts",
    "/leaderboard",
    "/payouts",
    "/settings",
  ]),
};

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const { data, status } = useSession();
  const role = (data as any)?.role as Role | undefined;

  // Поки вантажиться сесія — рендеримо пустий (або легкий лоадер)
  if (status === "loading") {
    return (
      <aside className="hidden md:block w-[272px] shrink-0 border-r border-indigo-200/70 bg-gradient-to-b from-indigo-50/80 via-indigo-50/60 to-indigo-100/40 backdrop-blur" />
    );
  }

  // Якщо немає ролі (неавтентифікований) — сайдбар не показуємо
  if (!role) return null;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Відфільтрувати айтеми за роллю
  const visibleItems = items.filter((i) => allowedByRole[role].has(i.href));

  return (
    <aside
      className={[
        "hidden md:block w-[272px] shrink-0 border-r",
        "border-indigo-200/70 bg-gradient-to-b from-indigo-50/80 via-indigo-50/60 to-indigo-100/40",
        "backdrop-blur supports-[backdrop-filter]:from-indigo-50/70 supports-[backdrop-filter]:to-indigo-100/30",
      ].join(" ")}
    >
      {/* Верхня плашка */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-indigo-200/70">
        <div className="h-8 w-8 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">
          C
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-slate-900">CharmOps</div>
          <div className="text-[11px] text-indigo-700/70">Operate with charm</div>
        </div>
      </div>

      {/* Навігація з власним скролом */}
      <div className="h-[calc(100dvh-56px)] overflow-y-auto scroll-area">
        <nav className="px-2 py-3 space-y-1.5">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-indigo-100/80 text-indigo-800"
                    : "text-slate-800 hover:bg-indigo-50/80 hover:text-slate-900",
                ].join(" ")}
              >
                {/* індикатор активності */}
                <span
                  aria-hidden
                  className={[
                    "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full",
                    active ? "bg-indigo-500/80" : "bg-transparent",
                  ].join(" ")}
                />
                <Icon
                  className={[
                    "h-5 w-5 shrink-0 transition-colors",
                    active ? "text-indigo-600" : "text-indigo-500/80 group-hover:text-indigo-600",
                  ].join(" ")}
                />
                <span className={active ? "font-medium" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* М’які індиго-скролбари */}
      <style jsx global>{`
        :root {
          --scroll-track: rgba(238, 242, 255, 0.8);
          --scroll-thumb: rgba(165, 180, 252, 0.8);
          --scroll-thumb-hover: rgba(99, 102, 241, 0.9);
        }
        .scroll-area {
          scrollbar-width: thin;
          scrollbar-color: var(--scroll-thumb) var(--scroll-track);
        }
        .scroll-area::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .scroll-area::-webkit-scrollbar-track {
          background: var(--scroll-track);
          border-radius: 999px;
        }
        .scroll-area::-webkit-scrollbar-thumb {
          background-color: var(--scroll-thumb);
          border-radius: 999px;
          border: 2px solid var(--scroll-track);
        }
        .scroll-area::-webkit-scrollbar-thumb:hover {
          background-color: var(--scroll-thumb-hover);
        }
      `}</style>
    </aside>
  );
}

/* ===== Преміум outline-іконки (м’які під індиго) ===== */
function IconDashboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.6 19a5.4 5.4 0 0 1 10.8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="17.5" cy="9" r="2.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.6 19c.3-2.2 1.8-3.7 4.4-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconFolders(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 7.6h6l1.6 1.6H21A1.8 1.8 0 0 1 22.8 11V17a2.5 2.5 0 0 1-2.5 2.5H5.7A2.7 2.7 0 0 1 3 16.8V7.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3 9.6h18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconChat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5.4 18.6 3.8 21l3.1-.8A10 10 0 1 0 5.4 18.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="9" cy="10.5" r="1" fill="currentColor" />
      <circle cx="12" cy="10.5" r="1" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}
function IconAlert(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3.6 3.9 19a1.2 1.2 0 0 0 1.1 1.8h14a1.2 1.2 0 0 0 1.1-1.8L12 3.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.8" r="1.2" fill="currentColor" />
    </svg>
  );
}
function IconTrophy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 5h12v2a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 5H5a2 2 0 0 0 0 4h1M17 5h2a2 2 0 1 1 0 4h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 17h6M8 20h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2.1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6.5" y="13" width="5" height="2.5" rx="0.6" fill="currentColor" />
    </svg>
  );
}
function IconSettings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 12.8c-.1-.5-.1-1.1 0-1.6l2.1-.6a6.7 6.7 0 0 1 1.1-1.9l-1-2a7 7 0 0 1 2.3-1.3l1.5 1.5c.6-.2 1.3-.3 2-.3s1.4.1 2 .3l1.5-1.5a7 7 0 0 1 2.3 1.3l-1 2c.4.6.8 1.2 1.1 1.9l2.1.6c.1.5.1 1.1 0 1.6l-2.1.6a6.7 6.7 0 0 1-1.1 1.9l1 2a7 7 0 0 1-2.3 1.3l-1.5-1.5c-.6.2-1.3.3-2 .3s-1.4-.1-2-.3l-1.5 1.5a7 7 0 0 1-2.3-1.3l1-2a6.7 6.7 0 0 1-1.1-1.9l-2.1-.6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IconShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3.6 5 6.1v6.4c0 3.9 2.9 6.7 7 7.9 4.1-1.2 7-4 7-7.9V6.1L12 3.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
