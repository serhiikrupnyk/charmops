"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type TopbarProps = {
  onOpenSidebar?: () => void; // <- додано: відкриття моб. сайдбару
};

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const { data } = useSession();
  const userLabel = data?.user?.name || data?.user?.email || "Користувач";

  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  // Закриття по кліку назовні та по Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = detailsRef.current;
      if (!el || !el.open) return;
      if (!el.contains(e.target as Node)) el.removeAttribute("open");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") detailsRef.current?.removeAttribute("open");
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Хелпер: закрити меню вручну (після кліку на пункт)
  const closeMenu = () => detailsRef.current?.removeAttribute("open");

  return (
    <header className="h-14 border-b border-slate-300 bg-slate-200/80 backdrop-blur supports-[backdrop-filter]:bg-slate-200/70 flex items-center justify-between px-3 sm:px-4">
      {/* Left: burger + title */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden inline-flex items-center justify-center rounded-xl border border-slate-400 px-2.5 py-1.5 text-slate-800 hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Відкрити меню"
          aria-controls="mobile-sidebar"
        >
          <IconMenu />
        </button>
        <span className="hidden md:inline text-sm text-slate-700">Панель</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="hidden sm:block">
          <label htmlFor="topbar-search" className="sr-only">
            Пошук
          </label>
          <div className="relative">
            <input
              id="topbar-search"
              placeholder="Пошук…"
              className="peer text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <IconSearch />
            </span>
          </div>
        </div>

        {/* User menu */}
        <details ref={detailsRef} className="relative">
          <summary
            className="list-none cursor-pointer select-none inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white/80 hover:bg-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-haspopup="menu"
          >
            <span className="truncate max-w-[160px] sm:max-w-[220px]">{userLabel}</span>
            <span aria-hidden className="text-slate-500">
              <IconChevronDown />
            </span>
          </summary>

          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-slate-200 bg-indigo-50/60">
              <div className="text-xs text-slate-600">Увійшли як</div>
              <div className="font-medium text-slate-900 truncate">{userLabel}</div>
            </div>

            <MenuLink href="/settings" onClick={closeMenu}>
              Налаштування
            </MenuLink>
            <MenuLink href="/profile" onClick={closeMenu}>
              Профіль
            </MenuLink>

            <div className="border-t border-slate-200" />

            <button
              onClick={() => {
                closeMenu();
                signOut({ callbackUrl: "/" });
              }}
              role="menuitem"
              className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-100"
            >
              Вийти
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}

/* ===== Icons ===== */
function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path
        d="M21 21l-4.35-4.35m2.1-5.05a7.05 7.05 0 1 1-14.1 0 7.05 7.05 0 0 1 14.1 0Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
