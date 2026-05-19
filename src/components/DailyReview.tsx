"use client";

import { useMemo, useState } from "react";
import type { TimeRecord, Category } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatTimeRange(startTime: number, endTime: number): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function toLocalDateString(timestamp: number): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCategoryLabel(category: Category | null): string {
  if (!category) return "未分类";
  return CATEGORY_LABELS[category];
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: "#60a5fa",
  Learning: "#a78bfa",
  Admin: "#f59e0b",
  Life: "#34d399",
  "Self-Care": "#f472b6",
  Exercise: "#fb7185",
  Entertainment: "#facc15",
  Rest: "#94a3b8",
  Uncategorized: "#52525b",
};

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { category: string; duration: number } }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const label =
    item.category === "Uncategorized"
      ? "未分类"
      : CATEGORY_LABELS[item.category as Category];

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm shadow-sm">
      <div className="font-medium">{label}</div>
      <div className="text-zinc-500 dark:text-zinc-400">
        {formatDuration(item.duration)}
      </div>
    </div>
  );
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  if (
    cx == null ||
    cy == null ||
    midAngle == null ||
    innerRadius == null ||
    outerRadius == null ||
    percent == null
  ) {
    return null;
  }

  if (percent < 0.06) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function DailyReview({ records }: { records: TimeRecord[] }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return toLocalDateString(Date.now());
  });

  const dayRecords = useMemo(() => {
    return [...records]
    .filter((record) => record.category !== "Interrupted")
      .filter((record) => toLocalDateString(record.startTime) === selectedDate)
      .sort((a, b) => a.startTime - b.startTime);
  }, [records, selectedDate]);

  const totalMs = useMemo(() => {
    return dayRecords.reduce(
      (sum, record) => sum + (record.endTime - record.startTime),
      0
    );
  }, [dayRecords]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const record of dayRecords) {
      const category = record.category ?? "Uncategorized";
      const duration = Math.max(0, record.endTime - record.startTime);
      totals.set(category, (totals.get(category) ?? 0) + duration);
    }

    return Array.from(totals.entries())
      .map(([category, duration]) => ({
        category,
        label:
          category === "Uncategorized"
            ? "未分类"
            : CATEGORY_LABELS[category as Category],
        duration,
      }))
      .sort((a, b) => b.duration - a.duration);
  }, [dayRecords]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">当日回顾</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-zinc-200 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-2xl border border-zinc-100 dark:border-white/10 bg-white dark:bg-white/5 p-4">
        <div className="mb-4 text-sm text-zinc-500 dark:text-white/70">
          今天总计：{formatDuration(totalMs)}
        </div>

        {categoryTotals.length > 0 && (
          <div className="mb-6 rounded-xl border border-zinc-100 dark:border-white/10 bg-zinc-50 dark:bg-black/20 p-4">
            <div className="mb-4 text-sm font-medium text-zinc-700 dark:text-white/80">
              分类汇总
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      dataKey="duration"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {categoryTotals.map((item) => (
                        <Cell
                          key={item.category}
                          fill={CATEGORY_COLORS[item.category] ?? "#52525b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {categoryTotals.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[item.category] ?? "#52525b",
                        }}
                      />
                      <span className="min-w-0 break-words text-zinc-700 dark:text-white/80">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center text-zinc-500 dark:text-white/70 shrink-0">
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {dayRecords.length === 0 ? (
          <div className="text-sm text-zinc-400 dark:text-white/50">
            这一天还没有记录。
          </div>
        ) : (
          <div className="space-y-3">
            {dayRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-zinc-100 dark:border-white/10 bg-zinc-50 dark:bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-zinc-500 dark:text-white/60">
                    {formatTimeRange(record.startTime, record.endTime)}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-white/60">
                    {formatDuration(record.endTime - record.startTime)}
                  </div>
                </div>

                <div className="mt-2 text-base">{record.label}</div>

                <div className="mt-1 text-sm text-zinc-400 dark:text-white/50">
                  {getCategoryLabel(record.category)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
