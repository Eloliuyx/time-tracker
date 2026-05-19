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

export const CATEGORY_LABELS: Record<Category, string> = {
  Work: "工作",
  Learning: "学习",
  Admin: "事务",
  Life: "生活",
  "Self-Care": "自我照料",
  Exercise: "运动",
  Entertainment: "娱乐",
  Rest: "休息",
  Interrupted: "记录中断",
};

export function getCategoryLabel(category: Category | null): string {
  if (!category) return "未分类";
  return CATEGORY_LABELS[category];
}
