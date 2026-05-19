"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, toggleLanguage } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
      aria-label="Toggle language"
    >
      <span className={language === "en" ? "font-semibold text-zinc-900 dark:text-white" : ""}>
        EN
      </span>
      <span className="mx-1 text-zinc-300 dark:text-zinc-600">|</span>
      <span className={language === "zh" ? "font-semibold text-zinc-900 dark:text-white" : ""}>
        中
      </span>
    </button>
  );
}
