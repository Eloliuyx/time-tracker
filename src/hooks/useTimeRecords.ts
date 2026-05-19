"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { TimeRecord, Category } from "@/types";
import { generateId } from "@/lib/time";
import {
  getRecords,
  putRecord,
  deleteRecord as dbDeleteRecord,
  getSessionStart,
  setSessionStart,
} from "@/lib/db";

const MAX_ACTIVE_SESSION_MS = 24 * 60 * 60 * 1000;
const INTERRUPTED_LABEL = "记录中断";

async function classifyCategory(label: string): Promise<Category | null> {
  try {
    const response = await fetch("/api/classify-category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ label }),
    });

    const text = await response.text();
    console.log("classify-category status:", response.status);
    console.log("classify-category body:", text);

    if (!response.ok) {
      return null;
    }

    const data = JSON.parse(text);
const category = data.category ?? null;

if (category === "Interrupted") {
  return null;
}

return category;
  } catch (error) {
    console.error("Category classification error:", error);
    return null;
  }
}

export function useTimeRecords() {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [initialStart, setInitialStart] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [interruptedNotice, setInterruptedNotice] = useState<string | null>(null);

  const sessionStart = useMemo(() => {
    if (records.length > 0) return records[records.length - 1].endTime;
    return initialStart;
  }, [records, initialStart]);

  useEffect(() => {
    async function init() {
      const storedRecords = await getRecords();
      const now = Date.now();

      let start: number | null = null;

      if (storedRecords.length > 0) {
        start = storedRecords[storedRecords.length - 1].endTime;
      } else {
        start = (await getSessionStart()) || now;
      }

      if (start && now - start > MAX_ACTIVE_SESSION_MS) {
        const interruptedRecord: TimeRecord = {
          id: generateId(),
          label: INTERRUPTED_LABEL,
          startTime: start,
          endTime: now,
          category: "Interrupted",
        };

        const nextRecords = [...storedRecords, interruptedRecord];

        setRecords(nextRecords);
        setInitialStart(null);
        setInterruptedNotice("上次记录似乎中断了，已为你从现在重新开始。");

        await putRecord(interruptedRecord);
        await setSessionStart(now);
      } else {
        setRecords(storedRecords);

        if (storedRecords.length === 0) {
          await setSessionStart(start);
          setInitialStart(start);
        }
      }

      setHydrated(true);
    }

    init();
  }, []);

  const addRecord = useCallback(
    async (label: string) => {
      if (!sessionStart) return;

      const trimmed = label.trim();
      if (!trimmed) return;

      const now = Date.now();
      const category = await classifyCategory(trimmed);

      const newRecord: TimeRecord = {
        id: generateId(),
        label: trimmed,
        startTime: sessionStart,
        endTime: now,
        category,
      };

      setRecords((prev) => [...prev, newRecord]);

      await putRecord(newRecord);
      await setSessionStart(now);
      setInterruptedNotice(null);
    },
    [sessionStart]
  );

  const updateLabel = useCallback(
    async (id: string, label: string) => {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, label } : r))
      );

      const record = records.find((r) => r.id === id);
      if (record) {
        await putRecord({ ...record, label });
      }
    },
    [records]
  );

  const updateCategory = useCallback(
    async (id: string, category: Category) => {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, category } : r))
      );

      const record = records.find((r) => r.id === id);
      if (record) {
        await putRecord({ ...record, category });
      }
    },
    [records]
  );

  const deleteLatestRecord = useCallback(async () => {
    if (records.length === 0) return;

    const latest = records[records.length - 1];
    setRecords((prev) => prev.slice(0, -1));

    await dbDeleteRecord(latest.id);

    if (records.length === 1) {
      setInitialStart(latest.startTime);
      await setSessionStart(latest.startTime);
    }
  }, [records]);

  const importRecords = useCallback(async (imported: TimeRecord[]) => {
    const { putAllRecords } = await import("@/lib/db");
    await putAllRecords(imported);
    setRecords(imported);
  }, []);

  return {
    records,
    sessionStart,
    hydrated,
    interruptedNotice,
    addRecord,
    updateLabel,
    updateCategory,
    deleteLatestRecord,
    importRecords,
  };
}
