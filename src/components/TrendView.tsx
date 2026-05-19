"use client";

import { useMemo, useState } from "react";
import type { Category, TimeRecord } from "@/types";
import { USER_CATEGORIES } from "@/types";
import { useI18n } from "@/lib/i18n";

type RangeDays = 7 | 30 | 90;
type DisplayCategory = Exclude<Category, "Interrupted"> | "Uncategorized";
type Language = "zh" | "en";

interface DayBucket {
  date: string;
  label: string;
  hasAnyRecord: boolean;
  totalMs: number;
  byCategory: Record<string, number>;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function toLocalDateString(timestamp: number): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getShortDateLabel(dateString: string): string {
  const d = new Date(`${dateString}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getLocalizedDateLabel(dateString: string, language: Language): string {
  const d = new Date(`${dateString}T00:00:00`);

  if (language === "zh") {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getRangeDates(rangeDays: RangeDays): string[] {
  const today = startOfLocalDay(new Date());
  const start = addDays(today, -(rangeDays - 1));

  return Array.from({ length: rangeDays }, (_, index) => {
    const d = addDays(start, index);
    return toLocalDateString(d.getTime());
  });
}

function getCategoryKey(category: Category | null): string {
  if (!category) return "Uncategorized";
  return category;
}

function splitRecordByDay(record: TimeRecord): Array<{
  date: string;
  duration: number;
  category: string;
}> {
  const chunks: Array<{ date: string; duration: number; category: string }> = [];

  let cursor = record.startTime;
  const end = record.endTime;

  while (cursor < end) {
    const cursorDate = new Date(cursor);
    const nextMidnight = new Date(
      cursorDate.getFullYear(),
      cursorDate.getMonth(),
      cursorDate.getDate() + 1
    ).getTime();

    const chunkEnd = Math.min(end, nextMidnight);
    const duration = Math.max(0, chunkEnd - cursor);

    chunks.push({
      date: toLocalDateString(cursor),
      duration,
      category: getCategoryKey(record.category),
    });

    cursor = chunkEnd;
  }

  return chunks;
}

function buildDayBuckets(
  records: TimeRecord[],
  rangeDays: RangeDays
): DayBucket[] {
  const dates = getRangeDates(rangeDays);
  const buckets = new Map<string, DayBucket>();

  for (const date of dates) {
    buckets.set(date, {
      date,
      label: getShortDateLabel(date),
      hasAnyRecord: false,
      totalMs: 0,
      byCategory: {},
    });
  }

  const rangeStart = new Date(`${dates[0]}T00:00:00`).getTime();
  const rangeEnd =
    new Date(`${dates[dates.length - 1]}T00:00:00`).getTime() +
    24 * 60 * 60 * 1000;

  const effectiveRecords = records.filter(
    (record) => record.category !== "Interrupted"
  );

  for (const record of effectiveRecords) {
    if (record.endTime <= rangeStart || record.startTime >= rangeEnd) {
      continue;
    }

    const clippedRecord: TimeRecord = {
      ...record,
      startTime: Math.max(record.startTime, rangeStart),
      endTime: Math.min(record.endTime, rangeEnd),
    };

    const chunks = splitRecordByDay(clippedRecord);

    for (const chunk of chunks) {
      const bucket = buckets.get(chunk.date);
      if (!bucket) continue;

      bucket.hasAnyRecord = true;
      bucket.totalMs += chunk.duration;
      bucket.byCategory[chunk.category] =
        (bucket.byCategory[chunk.category] ?? 0) + chunk.duration;
    }
  }

  return dates.map((date) => buckets.get(date)!);
}

function getHeatmapColumns(rangeDays: RangeDays): number {
  if (rangeDays === 7) return 7;
  return 10;
}

function getIntensityClass(
  category: DisplayCategory,
  value: number,
  maxValue: number,
  hasAnyRecord: boolean
): string {
  if (!hasAnyRecord) {
    return "border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent";
  }

  if (value <= 0) {
    return "bg-zinc-100 dark:bg-zinc-800";
  }

  const ratio = maxValue > 0 ? value / maxValue : 0;

  const palette: Record<DisplayCategory, [string, string, string, string]> = {
    Work: [
      "bg-blue-100 dark:bg-blue-950/60",
      "bg-blue-200 dark:bg-blue-900/70",
      "bg-blue-300 dark:bg-blue-700/80",
      "bg-blue-500 dark:bg-blue-500",
    ],
    Learning: [
      "bg-violet-100 dark:bg-violet-950/60",
      "bg-violet-200 dark:bg-violet-900/70",
      "bg-violet-300 dark:bg-violet-700/80",
      "bg-violet-500 dark:bg-violet-500",
    ],
    Admin: [
      "bg-amber-100 dark:bg-amber-950/60",
      "bg-amber-200 dark:bg-amber-900/70",
      "bg-amber-300 dark:bg-amber-700/80",
      "bg-amber-500 dark:bg-amber-500",
    ],
    Life: [
      "bg-emerald-100 dark:bg-emerald-950/60",
      "bg-emerald-200 dark:bg-emerald-900/70",
      "bg-emerald-300 dark:bg-emerald-700/80",
      "bg-emerald-500 dark:bg-emerald-500",
    ],
    "Self-Care": [
      "bg-pink-100 dark:bg-pink-950/60",
      "bg-pink-200 dark:bg-pink-900/70",
      "bg-pink-300 dark:bg-pink-700/80",
      "bg-pink-500 dark:bg-pink-500",
    ],
    Exercise: [
      "bg-rose-100 dark:bg-rose-950/60",
      "bg-rose-200 dark:bg-rose-900/70",
      "bg-rose-300 dark:bg-rose-700/80",
      "bg-rose-500 dark:bg-rose-500",
    ],
    Entertainment: [
      "bg-yellow-100 dark:bg-yellow-950/60",
      "bg-yellow-200 dark:bg-yellow-900/70",
      "bg-yellow-300 dark:bg-yellow-700/80",
      "bg-yellow-500 dark:bg-yellow-500",
    ],
    Rest: [
      "bg-slate-100 dark:bg-slate-950/60",
      "bg-slate-200 dark:bg-slate-900/70",
      "bg-slate-300 dark:bg-slate-700/80",
      "bg-slate-500 dark:bg-slate-500",
    ],
    Uncategorized: [
      "bg-zinc-100 dark:bg-zinc-800",
      "bg-zinc-200 dark:bg-zinc-700",
      "bg-zinc-300 dark:bg-zinc-600",
      "bg-zinc-500 dark:bg-zinc-500",
    ],
  };

  const shades = palette[category] ?? palette.Uncategorized;

  if (ratio <= 0.25) return shades[0];
  if (ratio <= 0.5) return shades[1];
  if (ratio <= 0.75) return shades[2];
  return shades[3];
}

function getTintClass(category: DisplayCategory): string {
  const palette: Record<DisplayCategory, string> = {
    Work: "bg-blue-50 dark:bg-blue-950/20",
    Learning: "bg-violet-50 dark:bg-violet-950/20",
    Admin: "bg-amber-50 dark:bg-amber-950/20",
    Life: "bg-emerald-50 dark:bg-emerald-950/20",
    "Self-Care": "bg-pink-50 dark:bg-pink-950/20",
    Exercise: "bg-rose-50 dark:bg-rose-950/20",
    Entertainment: "bg-yellow-50 dark:bg-yellow-950/20",
    Rest: "bg-slate-50 dark:bg-slate-950/20",
    Uncategorized: "bg-zinc-50 dark:bg-zinc-900/40",
  };

  return palette[category] ?? palette.Uncategorized;
}

function getBarClass(category: string): string {
  const palette: Record<string, string> = {
    Work: "bg-blue-500",
    Learning: "bg-violet-500",
    Admin: "bg-amber-500",
    Life: "bg-emerald-500",
    "Self-Care": "bg-pink-500",
    Exercise: "bg-rose-500",
    Entertainment: "bg-yellow-500",
    Rest: "bg-slate-500",
    Uncategorized: "bg-zinc-500",
  };

  return palette[category] ?? "bg-zinc-500";
}

function getRangeLabel(
  rangeDays: RangeDays,
  buckets: DayBucket[],
  language: Language
): string {
  const first = buckets[0];
  const last = buckets[buckets.length - 1];

  if (!first || !last) {
    return language === "zh" ? `过去 ${rangeDays} 天` : `Past ${rangeDays} days`;
  }

  const start = getLocalizedDateLabel(first.date, language);
  const end = getLocalizedDateLabel(last.date, language);

  return language === "zh"
    ? `过去 ${rangeDays} 天 (${start} – ${end})`
    : `Past ${rangeDays} days (${start} – ${end})`;
}

export default function TrendView({ records }: { records: TimeRecord[] }) {
  const { t, language } = useI18n();

  const copy = {
    title: language === "zh" ? "近期趋势" : "Recent Trends",
    empty:
      language === "zh"
        ? `最近还没有可分析的记录。\n先记录几天，再回来看看时间趋势。`
        : `No analyzable records yet.\nTrack a few days first, then come back to review your trends.`,
    heatmapTitle: language === "zh" ? "热力图" : "Heatmap",
    heatmapSubtitle:
      language === "zh"
        ? "此类活动的频率和耗时强度。"
        : "Frequency and time intensity for this category.",
    days: language === "zh" ? "天" : "d",
    activeDays: language === "zh" ? "出现天数" : "Active days",
    total: language === "zh" ? "总时长" : "Total time",
    average: language === "zh" ? "出现日均" : "Avg active day",
    highest: language === "zh" ? "最高一天" : "Highest day",
    none: language === "zh" ? "暂无" : "None",
    noRecords: language === "zh" ? "无记录" : "No record on that day",
    zeroCategory:
      language === "zh" ? "有记录但该类为 0" : "Recorded day; 0 mins spent in this category",
    structureTitle: language === "zh" ? "总体时间构成" : "Time Structure",
    structureSubtitle:
      language === "zh"
        ? "已记录时间的分类占比。记录中断不计入统计。"
        : "Category breakdown of recorded time. Interrupted sessions are excluded.",
  };

  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [selectedCategory, setSelectedCategory] =
    useState<DisplayCategory>("Work");

  const buckets = useMemo(
    () => buildDayBuckets(records, rangeDays),
    [records, rangeDays]
  );

  const getDisplayLabel = (category: string): string => {
    if (category === "Uncategorized") return t.categories.Uncategorized;
    return t.categories[category as Category];
  };

  const structureData = useMemo(() => {
    const totals = new Map<string, number>();

    for (const bucket of buckets) {
      for (const [category, duration] of Object.entries(bucket.byCategory)) {
        totals.set(category, (totals.get(category) ?? 0) + duration);
      }
    }

    const totalMs = Array.from(totals.values()).reduce(
      (sum, value) => sum + value,
      0
    );

    const items = Array.from(totals.entries())
      .map(([category, duration]) => ({
        category,
        label: getDisplayLabel(category),
        duration,
        percentage: totalMs > 0 ? duration / totalMs : 0,
      }))
      .sort((a, b) => b.duration - a.duration);

    return { totalMs, items };
  }, [buckets, t.categories]);

  const categoryOptions: DisplayCategory[] = useMemo(() => {
    return [...USER_CATEGORIES, "Uncategorized"];
  }, []);

  const defaultCategory = useMemo(() => {
    const first = structureData.items.find(
      (item) => item.category !== "Uncategorized"
    );

    return (first?.category as DisplayCategory | undefined) ?? "Work";
  }, [structureData.items]);

  const actualSelectedCategory = useMemo(() => {
    if (categoryOptions.includes(selectedCategory)) {
      return selectedCategory;
    }

    return defaultCategory;
  }, [categoryOptions, selectedCategory, defaultCategory]);

  const selectedStats = useMemo(() => {
    const values = buckets.map((bucket) => ({
      ...bucket,
      selectedMs: bucket.byCategory[actualSelectedCategory] ?? 0,
    }));

    const activeDays = values.filter((item) => item.selectedMs > 0);
    const totalMs = activeDays.reduce((sum, item) => sum + item.selectedMs, 0);
    const maxMs = Math.max(0, ...values.map((item) => item.selectedMs));

    const highestDay = values.reduce<(typeof values)[number] | null>(
      (best, item) => {
        if (!best || item.selectedMs > best.selectedMs) return item;
        return best;
      },
      null
    );

    return {
      values,
      activeDays,
      totalMs,
      maxMs,
      highestDay: highestDay && highestDay.selectedMs > 0 ? highestDay : null,
    };
  }, [buckets, actualSelectedCategory]);

  const hasAnyEffectiveRecord = structureData.totalMs > 0;
  const heatmapColumns = getHeatmapColumns(rangeDays);
  const rangeLabel = getRangeLabel(rangeDays, buckets, language);
  const tileTintClass = getTintClass(actualSelectedCategory);

  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{copy.title}</h2>

          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/5 p-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setRangeDays(days as RangeDays)}
                className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                  rangeDays === days
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {days}
                {copy.days}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {rangeLabel}
        </div>
      </div>

      {!hasAnyEffectiveRecord ? (
        <div className="whitespace-pre-line rounded-2xl border border-zinc-100 dark:border-white/10 bg-white dark:bg-white/5 p-5 text-sm text-zinc-500 dark:text-white/60">
          {copy.empty}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-zinc-100 dark:border-white/10 bg-white dark:bg-white/5 p-4">
            <div className="mb-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">
                    {copy.heatmapTitle}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-white/50">
                    {copy.heatmapSubtitle}
                  </p>
                </div>

                <select
                  value={actualSelectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as DisplayCategory)
                  }
                  className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 shrink-0"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {getDisplayLabel(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div className={`rounded-xl px-3 py-3 ${tileTintClass}`}>
                <div className="text-xs text-zinc-400 dark:text-white/40">
                  {copy.activeDays}
                </div>
                <div className="mt-1 font-medium">
                  {selectedStats.activeDays.length}
                  {copy.days}
                </div>
              </div>

              <div className={`rounded-xl px-3 py-3 ${tileTintClass}`}>
                <div className="text-xs text-zinc-400 dark:text-white/40">
                  {copy.total}
                </div>
                <div className="mt-1 font-medium">
                  {formatDuration(selectedStats.totalMs)}
                </div>
              </div>

              <div className={`rounded-xl px-3 py-3 ${tileTintClass}`}>
                <div className="text-xs text-zinc-400 dark:text-white/40">
                  {copy.average}
                </div>
                <div className="mt-1 font-medium">
                  {selectedStats.activeDays.length > 0
                    ? formatDuration(
                        selectedStats.totalMs / selectedStats.activeDays.length
                      )
                    : "0m"}
                </div>
              </div>

              <div className={`rounded-xl px-3 py-3 ${tileTintClass}`}>
                <div className="text-xs text-zinc-400 dark:text-white/40">
                  {copy.highest}
                </div>
                <div className="mt-1 font-medium">
                  {selectedStats.highestDay
                    ? `${getLocalizedDateLabel(
                        selectedStats.highestDay.date,
                        language
                      )} · ${formatDuration(
                        selectedStats.highestDay.selectedMs
                      )}`
                    : copy.none}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 dark:bg-black/20 p-3">
              <div
                className="grid w-full gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${heatmapColumns}, minmax(0, 1fr))`,
                }}
              >
                {selectedStats.values.map((day) => (
                  <div
                    key={day.date}
                    title={`${getLocalizedDateLabel(day.date, language)} · ${
                      day.hasAnyRecord
                        ? formatDuration(day.selectedMs)
                        : copy.noRecords
                    }`}
                    className={`aspect-square w-full rounded-[5px] ${getIntensityClass(
                      actualSelectedCategory,
                      day.selectedMs,
                      selectedStats.maxMs,
                      day.hasAnyRecord
                    )}`}
                  />
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 dark:text-white/40">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-[3px] border border-dashed border-zinc-300 dark:border-zinc-700" />
                  <span>{copy.noRecords}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-[3px] bg-zinc-100 dark:bg-zinc-800" />
                  <span>{copy.zeroCategory}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 dark:border-white/10 bg-white dark:bg-white/5 p-4">
            <div className="mb-4">
              <h3 className="text-base font-semibold">
                {copy.structureTitle}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-white/50">
                {copy.structureSubtitle}
              </p>
            </div>

            <div className="space-y-3">
              {structureData.items.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-700 dark:text-white/80">
                      {item.label}
                    </span>
                    <span className="shrink-0 text-zinc-500 dark:text-white/60">
                      {Math.round(item.percentage * 100)}% ·{" "}
                      {formatDuration(item.duration)}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarClass(
                        item.category
                      )}`}
                      style={{ width: `${item.percentage * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
