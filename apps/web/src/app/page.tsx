import Header from "@/components/Header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* фоновий градієнт */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-slate-100 to-white" />

      <Header />

      <main className="mx-auto max-w-7xl px-4 lg:px-6 pt-12 pb-20">
        {/* HERO */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Early preview
            </span>

            <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900">
              CharmOps — операційна панель{" "}
              <span className="text-indigo-600">для чат-агентства</span>
            </h1>

            <p className="mt-4 text-lg text-slate-700">
              Стартовий скелет продукту: логін, базова навігація та візуальна система.
              Далі — поступове додавання фіч і модулів керування операціями.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Перейти до входу
              </Link>
              <a
                href="#how"
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-200 transition-colors"
              >
                Як це працює
              </a>
            </div>

            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { k: "Єдиний стиль", v: "slate + indigo, скляні панелі" },
                { k: "Готові патерни", v: "герої, секції, картки" },
                { k: "Масштабування", v: "компоненти легко розширювати" },
              ].map((i) => (
                <div key={i.k} className="p-4 rounded-2xl border border-slate-300 bg-white">
                  <dt className="font-medium text-slate-900">{i.k}</dt>
                  <dd className="text-sm text-slate-600 mt-1">{i.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* правий бік — «прев’ю» */}
          <aside className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">Preview</div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatCard title="Operators" value="5" />
              <StatCard title="Active Chats" value="128" />
              <StatCard title="SLA < 2m" value="94%" />
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <MiniChart title="Response time (min)" />
              <MiniChart title="CSAT (%)" />
            </div>
            <p className="mt-6 text-sm text-slate-600">
              Легка картка-ілюстрація: можна замінити на реальні графіки/скріншоти.
            </p>
          </aside>
        </section>

        {/* ЯК ЦЕ ПРАЦЮЄ */}
        <section id="how" className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-900">Як це працює</h2>
          <ol className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "Авторизація", desc: "Безпечний логін і базові ролі." },
              { step: "Навігація", desc: "Єдиний стиль, зрозумілі патерни." },
              { step: "Модулі", desc: "Додаємо блоки управління крок за кроком." },
              { step: "Аналітика", desc: "Панелі показників для щоденної роботи." },
            ].map((s, i) => (
              <li key={s.step} className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                <div className="text-xs text-indigo-700/80 mb-1">Крок {i + 1}</div>
                <div className="font-medium text-slate-900">{s.step}</div>
                <div className="text-sm text-slate-600 mt-1">{s.desc}</div>
              </li>
            ))}
          </ol>
        </section>

        {/* ДОДАТКОВО (можна зняти/замінити при рості) */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-900">Що закладено в основу</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard title="Чистий код" desc="Tailwind, прості компоненти, продумана типографія." />
            <FeatureCard title="Скалюється" desc="Легко додати нові сторінки, таблиці та графіки." />
            <FeatureCard title="A11y & UX" desc="Фокуси, контраст, зрозумілі активні стани." />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16">
          <div className="rounded-3xl border border-slate-300 bg-gradient-to-br from-indigo-50 to-white p-8 flex items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Готові продовжити?</h3>
              <p className="text-slate-700 mt-1">
                Перейдіть до входу та поступово вмикайте модулі CharmOps.
              </p>
            </div>
            <Link
              href="/login"
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Перейти до входу
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ==== допоміжні компоненти ==== */

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function MiniChart({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <svg viewBox="0 0 200 60" className="mt-3 w-full h-16">
        <polyline
          fill="none"
          stroke="#6366F1"
          strokeWidth="3"
          points="0,50 20,45 40,30 60,35 80,18 100,24 120,20 140,25 160,15 180,18 200,12"
        />
        <circle cx="200" cy="12" r="3" fill="#6366F1" />
      </svg>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="font-medium text-slate-900">{title}</div>
      <p className="mt-2 text-sm text-slate-700">{desc}</p>
    </div>
  );
}
