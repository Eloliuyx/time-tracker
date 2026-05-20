export const CATEGORIES = [
  "Work",
  "Learning",
  "Admin",
  "Life",
  "Self-Care",
  "Exercise",
  "Entertainment",
  "Rest",
  "Interrupted",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const USER_CATEGORIES = CATEGORIES.filter(
  (category) => category !== "Interrupted"
) as Exclude<Category, "Interrupted">[];

export interface TimeRecord {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  category: Category | null;
}

export interface TimeRecordRow {
  id: string;
  user_id: string;
  label: string;
  start_time: number;
  end_time: number;
  category: Category | null;
  created_at?: string;
  updated_at?: string;
}
