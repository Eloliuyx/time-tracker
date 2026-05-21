"use client";

import { useMemo, useState } from "react";
import type { TimeRecord } from "@/types";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

function formatCsvDate(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsv(records: TimeRecord[]) {
  const header = ["label", "category", "start_time", "end_time", "duration_minutes"];

  const rows = records.map((record) => {
    const durationMinutes = Math.round((record.endTime - record.startTime) / 60000);

    return [
      escapeCsv(record.label),
      escapeCsv(record.category ?? ""),
      escapeCsv(formatCsvDate(record.startTime)),
      escapeCsv(formatCsvDate(record.endTime)),
      String(durationMinutes),
    ].join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

export function SettingsView({
  records,
  onDeleteAllRecords,
}: {
  records: TimeRecord[];
  onDeleteAllRecords: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canDelete = confirmText === "DELETE RECORDS";

  const recordCount = useMemo(() => records.length, [records]);

  function handleExportCsv() {
    const csv = buildCsv(records);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.download = `just-now-records-${today}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function handleDeleteAllRecords() {
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    setMessage(null);

    try {
      await onDeleteAllRecords();
      setConfirmText("");
      setMessage(t.settings.deleteSuccess);
    } catch {
      setMessage(t.settings.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          {t.settings.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {t.settings.subtitle}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium">{t.settings.languageTitle}</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {t.settings.languageDescription}
            </p>
          </div>

          <LanguageToggle />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-medium">{t.settings.exportTitle}</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {t.settings.exportDescription}
        </p>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={records.length === 0}
          className="mt-4 h-11 w-full rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        >
          {t.settings.exportButton}
        </button>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-medium">{t.settings.privacyTitle}</h3>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {t.settings.privacyDescription}
        </p>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20">
        <h3 className="text-sm font-medium text-red-700 dark:text-red-300">
          {t.settings.dangerTitle}
        </h3>
        <p className="mt-2 text-xs leading-5 text-red-700/80 dark:text-red-300/80">
          {t.settings.deleteDescription.replace("{count}", String(recordCount))}
        </p>

        <input
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="DELETE RECORDS"
          className="mt-4 h-11 w-full rounded-xl border border-red-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-red-300 dark:border-red-900 dark:bg-zinc-950 dark:text-white"
        />

        <button
          type="button"
          onClick={handleDeleteAllRecords}
          disabled={!canDelete || isDeleting}
          className="mt-3 h-11 w-full rounded-xl bg-red-600 text-sm font-medium text-white transition disabled:opacity-40"
        >
          {isDeleting ? t.settings.deleting : t.settings.deleteButton}
        </button>

        {message && (
          <p className="mt-3 text-xs leading-5 text-red-700 dark:text-red-300">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
