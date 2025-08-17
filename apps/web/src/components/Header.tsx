"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-300 bg-slate-200/80 backdrop-blur supports-[backdrop-filter]:bg-slate-200/70">
      <div className="mx-auto max-w-7xl h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold shadow-sm">
            C
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-slate-900">CharmOps</div>
            <div className="text-[11px] text-slate-600">Operate with charm</div>
          </div>
        </Link>

        {/* Right controls */}
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl border border-slate-400 text-slate-800 hover:bg-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Увійти
          </Link>
        </nav>
      </div>
    </header>
  );
}
