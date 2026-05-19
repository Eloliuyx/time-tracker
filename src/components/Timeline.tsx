"use client";

import { useState, useRef, useEffect } from "react";
import type { TimeRecord, Category } from "@/types";
import { USER_CATEGORIES } from "@/types";
import { formatDuration, formatTime } from "@/lib/time";
import { useI18n } from "@/lib/i18n";

interface TimelineProps {
  records: TimeRecord[];
  onUpdateLabel: (id: string, label: string) => void;
  onUpdateCategory: (id: string, category: Category) => void;
  onDeleteLatest: () => void;
}

function TimelineItem({
  record,
  onUpdateLabel,
  onUpdateCategory,
  isLatest,
  onDelete,
}: {
  record: TimeRecord;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdateCategory: (id: string, category: Category) => void;
  isLatest: boolean;
  onDelete?: () => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(record.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.selectionStart = el.value.length;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== record.label) {
      onUpdateLabel(record.id, trimmed);
    } else {
      setEditValue(record.label);
    }
    setEditing(false);
  };

  return (
    <div
      className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3"
      onClick={() => {
        if (!editing) {
          setEditValue(record.label);
          setEditing(true);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === "Escape") {
                setEditValue(record.label);
                setEditing(false);
              }
            }}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-base font-medium bg-transparent outline-none resize-none border-b border-zinc-300 dark:border-zinc-600 pb-0.5 leading-normal"
            rows={1}
          />
        ) : (
          <span className="font-medium text-base whitespace-pre-wrap cursor-pointer">
            {record.label}
          </span>
        )}

        <span className="text-sm text-zinc-400 dark:text-zinc-500 font-mono whitespace-nowrap pt-0.5">
          {formatDuration(record.endTime - record.startTime)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <select
            value={record.category ?? ""}
            onChange={(e) => onUpdateCategory(record.id, e.target.value as Category)}
            onClick={(e) => e.stopPropagation()}
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-200"
          >
            <option value="" disabled>
              {t.categories.Uncategorized}
            </option>

            {record.category === "Interrupted" && (
              <option value="Interrupted">{t.categories.Interrupted}</option>
            )}

            {USER_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {t.categories[item]}
              </option>
            ))}
          </select>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
            {formatTime(record.startTime)} – {formatTime(record.endTime)}
          </p>
        </div>

        {isLatest && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(t.track.confirmUndo)) onDelete();
            }}
            className="text-xs text-red-400 hover:text-red-500 transition-colors shrink-0"
          >
            {t.track.undo}
          </button>
        )}
      </div>
    </div>
  );
}

export function Timeline({
  records,
  onUpdateLabel,
  onUpdateCategory,
  onDeleteLatest,
}: TimelineProps) {
  const { t } = useI18n();

  if (records.length === 0) {
    return (
      <p className="text-center text-zinc-400 dark:text-zinc-500 py-8 text-sm">
        {t.track.emptyTimeline}
      </p>
    );
  }

  const reversed = [...records].reverse().slice(0, 10);

  return (
    <div className="flex flex-col gap-3">
      {reversed.map((record, index) => (
        <TimelineItem
          key={record.id}
          record={record}
          onUpdateLabel={onUpdateLabel}
          onUpdateCategory={onUpdateCategory}
          isLatest={index === 0}
          onDelete={index === 0 ? onDeleteLatest : undefined}
        />
      ))}
    </div>
  );
}
