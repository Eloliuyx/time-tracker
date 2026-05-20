import type { TimeRecord, TimeRecordRow } from "@/types";
import { supabase } from "@/lib/supabase";

const SESSION_START_KEY = "sessionStart";

function mapRowToRecord(row: TimeRecordRow): TimeRecord {
  return {
    id: row.id,
    label: row.label,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category ?? null,
  };
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Not signed in");

  return user.id;
}

export async function getRecords(): Promise<TimeRecord[]> {
  const userId = await requireUserId();

  const pageSize = 1000;
  let from = 0;
  let allRows: TimeRecordRow[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("time_records")
      .select("*")
      .eq("user_id", userId)
      .order("end_time", { ascending: true })
      .order("start_time", { ascending: true })
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as TimeRecordRow[];
    allRows = allRows.concat(rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allRows.map(mapRowToRecord);
}

export async function putRecord(record: TimeRecord): Promise<void> {
  const userId = await requireUserId();

  const row: TimeRecordRow = {
    id: record.id,
    user_id: userId,
    label: record.label,
    start_time: record.startTime,
    end_time: record.endTime,
    category: record.category ?? null,
  };

  const { error } = await supabase.from("time_records").upsert(row);
  if (error) throw error;
}

export async function putAllRecords(records: TimeRecord[]): Promise<void> {
  const userId = await requireUserId();

  const { error: deleteError } = await supabase
    .from("time_records")
    .delete()
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  if (records.length === 0) return;

  const rows: TimeRecordRow[] = records.map((record) => ({
    id: record.id,
    user_id: userId,
    label: record.label,
    start_time: record.startTime,
    end_time: record.endTime,
    category: record.category ?? null,
  }));

  const { error: insertError } = await supabase.from("time_records").insert(rows);
  if (insertError) throw insertError;
}

export async function deleteRecord(id: string): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabase
    .from("time_records")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;
}

export async function getSessionStart(): Promise<number | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("app_meta")
    .select("value")
    .eq("user_id", userId)
    .eq("key", SESSION_START_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return typeof data.value === "number" ? data.value : null;
}

export async function setSessionStart(value: number): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabase.from("app_meta").upsert({
    user_id: userId,
    key: SESSION_START_KEY,
    value,
  });

  if (error) throw error;
}
