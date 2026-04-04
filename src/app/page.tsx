"use client";

import { useState } from "react";
import { TimeTracker } from "@/components/TimeTracker";
import AuthGate from "@/components/AuthGate";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"track" | "review">("track");

  return (
    <AuthGate>
      <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black font-sans">
        <main className="w-full max-w-lg px-4 py-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <img
                src="/logo.svg"
                alt="时间沙漏"
                className="w-7 h-7 dark:invert"
              />
              时间沙漏
            </h1>

            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/5 p-1">
              <button
                onClick={() => setActiveTab("track")}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  activeTab === "track"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                记录
              </button>
              <button
                onClick={() => setActiveTab("review")}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  activeTab === "review"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                回顾
              </button>
            </div>
          </div>

          <TimeTracker activeTab={activeTab} />
        </main>
      </div>
    </AuthGate>
  );
}
