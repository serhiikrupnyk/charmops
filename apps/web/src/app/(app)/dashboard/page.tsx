"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <p className="text-black/70 dark:text-white/70">
        Тут будуть віджети, метрики та останні події.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Активні оператори" value="—" />
        <Card title="Вхідні діалоги" value="—" />
        <Card title="Reply rate" value="—" />
        <Card title="Алерти" value="—" />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="text-sm text-black/60 dark:text-white/60">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
