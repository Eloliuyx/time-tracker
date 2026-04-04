"use client";

import { useTimeRecords } from "@/hooks/useTimeRecords";
import { CurrentSession } from "./CurrentSession";
import { RecordInput } from "./RecordInput";
import { Timeline } from "./Timeline";
import DailyReview from "@/components/DailyReview";

export function TimeTracker({
  activeTab,
}: {
  activeTab: "track" | "review";
}) {
  const {
    records,
    sessionStart,
    hydrated,
    addRecord,
    updateLabel,
    updateCategory,
    deleteLatestRecord,
  } = useTimeRecords();

  if (!hydrated) {
    return null;
  }

  if (activeTab === "review") {
    return <DailyReview records={records} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {sessionStart && <CurrentSession sessionStart={sessionStart} />}

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
