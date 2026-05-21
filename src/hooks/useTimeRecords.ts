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
  deleteAllRecords,
} from "@/lib/db";

const MAX_ACTIVE_SESSION_MS = 24 * 60 * 60 * 1000;
const INTERRUPTED_LABEL = "记录中断";

function sortRecords(records: TimeRecord[]): TimeRecord[] {
  return [...records].sort((a, b) => {
    if (a.endTime !== b.endTime) return a.endTime - b.endTime;
    return a.startTime - b.startTime;
  });
}

function getLatestEndTime(records: TimeRecord[]): number | null {
  if (records.length === 0) return null;
  return Math.max(...records.map((record) => record.endTime));
}

async function classifyCategory(label: string): Promise<Category | null> {
  try {
    const response = await fetch("/api/classify-category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ label }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
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
  const [interruptedNotice, setInterruptedNotice] = useState<string | null>(
    null
  );

  const sessionStart = useMemo(() => {
    if (records.length > 0) return records[records.length - 1].endTime;
    return initialStart;
  }, [records, initialStart]);

  const refreshRecords = useCallback(async () => {
    const latestRecords = sortRecords(await getRecords());
    setRecords(latestRecords);

    if (latestRecords.length > 0) {
      setInitialStart(null);
      return latestRecords;
    }

    const storedStart = await getSessionStart();
    const start = storedStart ?? Date.now();

    if (!storedStart) {
      await setSessionStart(start);
    }

    setInitialStart(start);
    return latestRecords;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const storedRecords = sortRecords(await getRecords());
        const now = Date.now();

        let start: number | null = null;

        if (storedRecords.length > 0) {
          start = getLatestEndTime(storedRecords);
        } else {
          start = (await getSessionStart()) || now;
        }

        if (cancelled) return;

        if (start && now - start > MAX_ACTIVE_SESSION_MS) {
          const interruptedRecord: TimeRecord = {
            id: generateId(),
            label: INTERRUPTED_LABEL,
            startTime: start,
            endTime: now,
            category: "Interrupted",
          };

          const nextRecords = sortRecords([...storedRecords, interruptedRecord]);

          setRecords(nextRecords);
          setInitialStart(null);
          setInterruptedNotice(
            "上次记录似乎中断了，已为你从现在重新开始。"
          );

          await putRecord(interruptedRecord);
          await setSessionStart(now);
        } else {
          setRecords(storedRecords);

          if (storedRecords.length === 0 && start) {
            await setSessionStart(start);
            setInitialStart(start);
          } else {
            setInitialStart(null);
          }

          setInterruptedNotice(null);
        }
      } catch (error) {
        console.error("Failed to initialize records:", error);
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleFocus() {
      refreshRecords().catch((error) => {
        console.error("Failed to refresh records:", error);
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshRecords]);

  const addRecord = useCallback(
    async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;

      const category = await classifyCategory(trimmed);

      // Re-fetch the latest server state right before writing.
      // This prevents an old tab / old PWA window from creating overlapping records.
      const latestRecords = sortRecords(await getRecords());
      const latestEnd = getLatestEndTime(latestRecords);
      const storedSessionStart = await getSessionStart();

      const now = Date.now();

      const candidates = [
        sessionStart,
        latestEnd,
        storedSessionStart,
      ].filter((value): value is number => typeof value === "number");

      const safeStartTime =
        candidates.length > 0 ? Math.max(...candidates) : now;

      if (safeStartTime >= now) {
        setRecords(latestRecords);
        await setSessionStart(now);
        setInitialStart(latestRecords.length === 0 ? now : null);
        setInterruptedNotice(null);
        return;
      }

      const newRecord: TimeRecord = {
        id: generateId(),
        label: trimmed,
        startTime: safeStartTime,
        endTime: now,
        category,
      };

      const nextRecords = sortRecords([...latestRecords, newRecord]);

      setRecords(nextRecords);
      setInitialStart(null);
      setInterruptedNotice(null);

      await putRecord(newRecord);
      await setSessionStart(now);

      // Pull once more after writing, so this tab reflects server truth.
      await refreshRecords();
    },
    [sessionStart, refreshRecords]
  );

  const updateLabel = useCallback(
    async (id: string, label: string) => {
      const nextLabel = label.trim();
      if (!nextLabel) return;

      setRecords((prev) =>
        sortRecords(prev.map((record) =>
          record.id === id ? { ...record, label: nextLabel } : record
        ))
      );

      const record = records.find((record) => record.id === id);

      if (record) {
        await putRecord({ ...record, label: nextLabel });
        await refreshRecords();
      }
    },
    [records, refreshRecords]
  );

  const updateCategory = useCallback(
    async (id: string, category: Category) => {
      setRecords((prev) =>
        sortRecords(prev.map((record) =>
          record.id === id ? { ...record, category } : record
        ))
      );

      const record = records.find((record) => record.id === id);

      if (record) {
        await putRecord({ ...record, category });
        await refreshRecords();
      }
    },
    [records, refreshRecords]
  );

  const deleteLatestRecord = useCallback(async () => {
    const latestRecords = sortRecords(await getRecords());
    if (latestRecords.length === 0) return;

    const latest = latestRecords[latestRecords.length - 1];

    await dbDeleteRecord(latest.id);

    const remainingRecords = sortRecords(await getRecords());
    setRecords(remainingRecords);
    setInterruptedNotice(null);

    if (remainingRecords.length === 0) {
      setInitialStart(latest.startTime);
      await setSessionStart(latest.startTime);
    } else {
      const nextStart = getLatestEndTime(remainingRecords);
      setInitialStart(null);

      if (nextStart) {
        await setSessionStart(nextStart);
      }
    }
  }, []);

  const deleteAllUserRecords = useCallback(async () => {
    const now = Date.now();

    await deleteAllRecords();
    await setSessionStart(now);

    setRecords([]);
    setInitialStart(now);
    setInterruptedNotice(null);
    setHydrated(true);
  }, []);

  const importRecords = useCallback(async (imported: TimeRecord[]) => {
    const { putAllRecords } = await import("@/lib/db");

    const sortedImported = sortRecords(imported);
    await putAllRecords(sortedImported);
    setRecords(sortedImported);
    setInterruptedNotice(null);

    const latestEnd = getLatestEndTime(sortedImported);

    if (latestEnd) {
      await setSessionStart(latestEnd);
      setInitialStart(null);
    } else {
      const now = Date.now();
      await setSessionStart(now);
      setInitialStart(now);
    }
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
    deleteAllUserRecords,
    importRecords,
  };
}
