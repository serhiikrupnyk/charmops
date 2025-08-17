"use client";

import { ReactNode, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-slate-600">Завантаження…</div>
      </div>
    );
  }

  // middleware вже не пустить незалогінених, але на всяк — fallback
  if (status !== "authenticated") return null;

  return (
    <div className="h-dvh bg-slate-100 text-slate-800 antialiased">
      {/* Сітка всього застосунку */}
      <div className="h-full grid lg:grid-cols-[280px_1fr]">
        {/* Сайдбар (ліворуч), власний скрол */}
        <aside className="hidden lg:block border-r border-slate-300 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="h-full overflow-y-auto scroll-area">
            <Sidebar />
          </div>
        </aside>

        {/* Права частина: топбар + контент, теж із власним скролом */}
        <div className="h-full grid grid-rows-[auto_1fr] overflow-hidden">
          {/* Топбар: скляний фон, тонкий бордер (обгортка, якщо сам Topbar без фону) */}
          <div className="sticky top-0 z-40 border-b border-slate-300 bg-slate-200/80 backdrop-blur supports-[backdrop-filter]:bg-slate-200/70">
            <Topbar />
          </div>

          {/* Контентна зона зі своїм скролом */}
          <div className="min-h-0 overflow-y-auto scroll-area p-3 sm:p-4 lg:p-6">
            <main className="min-h-full rounded-3xl border border-slate-300 bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Стилі для скролбарів у «преміум» стилі */}
      <style jsx global>{`
        :root {
          --scroll-track: #e2e8f0; /* slate-200 */
          --scroll-thumb: #94a3b8; /* slate-400 */
          --scroll-thumb-hover: #6366f1; /* indigo-500 */
        }
        .scroll-area {
          scrollbar-width: thin; /* Firefox */
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
    </div>
  );
}
