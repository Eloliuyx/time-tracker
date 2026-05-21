"use client";

import { useTimeRecords } from "@/hooks/useTimeRecords";
import { CurrentSession } from "./CurrentSession";
import { RecordInput } from "./RecordInput";
import { Timeline } from "./Timeline";
import DailyReview from "@/components/DailyReview";
import TrendView from "@/components/TrendView";
import { useI18n } from "@/lib/i18n";
import { SettingsView } from "@/components/SettingsView";

export function TimeTracker({
  activeTab,
}: {
  activeTab: "track" | "review" | "trend" | "settings";
}) {
  const { t } = useI18n();

  const {
    records,
    sessionStart,
    hydrated,
    interruptedNotice,
    addRecord,
    updateLabel,
    updateCategory,
    deleteLatestRecord,
    deleteAllUserRecords,
  } = useTimeRecords();

  if (!hydrated) {
    return null;
  }

  if (activeTab === "review") {
    return <DailyReview records={records} />;
  }

  if (activeTab === "trend") {
    return <TrendView records={records} />;
  }

  if (activeTab === "settings") {
  return (
    <SettingsView
      records={records}
      onDeleteAllRecords={deleteAllUserRecords}
    />
  );
}

  return (
    <div className="flex flex-col gap-6">
      {sessionStart && <CurrentSession sessionStart={sessionStart} />}

      {interruptedNotice && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {t.track.interruptedNotice}
        </div>
      )}

      <RecordInput onSubmit={addRecord} />

      <Timeline
        records={records}
        onUpdateLabel={updateLabel}
        onUpdateCategory={updateCategory}
        onDeleteLatest={deleteLatestRecord}
      />
    </div>
  );
}
