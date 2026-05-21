"use client";

import { useEffect, useState } from "react";
import { TimeTracker } from "@/components/TimeTracker";
import AuthGate from "@/components/AuthGate";
import { LandingPage } from "@/components/LandingPage";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

type ActiveTab = "track" | "review" | "trend" | "settings";

export default function Home() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveTab>("track");
  const [showAuth, setShowAuth] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        setShowAuth(true);
      }

      setCheckedSession(true);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setShowAuth(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!checkedSession) {
    return null;
  }

  if (!showAuth) {
    return <LandingPage onEnter={() => setShowAuth(true)} />;
  }

  return (
    <AuthGate onOpenSettings={() => setActiveTab("settings")}>
      <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black font-sans">
        <main className="w-full max-w-lg px-4 py-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <img
                src="/favicon.png"
                alt={t.appName}
                className="w-7 h-7 dark:invert"
              />
              {t.appName}
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
                {t.nav.track}
              </button>

              <button
                onClick={() => setActiveTab("review")}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  activeTab === "review"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {t.nav.review}
              </button>

              <button
                onClick={() => setActiveTab("trend")}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  activeTab === "trend"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {t.nav.trend}
              </button>
            </div>
          </div>

          <TimeTracker activeTab={activeTab} />
        </main>
      </div>
    </AuthGate>
  );
}
