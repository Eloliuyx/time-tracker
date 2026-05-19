"use client";

import { useState, useEffect } from "react";
import { formatDuration } from "@/lib/time";
import { useI18n } from "@/lib/i18n";

export function CurrentSession({ sessionStart }: { sessionStart: number }) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(() => Date.now() - sessionStart);

  useEffect(() => {
    setElapsed(Date.now() - sessionStart);
    const timer = setInterval(() => {
      setElapsed(Date.now() - sessionStart);
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStart]);

  return (
    <div className="text-center py-8">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {t.track.inProgress}
        </span>
      </div>
      <p className="text-4xl font-mono font-semibold tracking-tight">
        {formatDuration(elapsed)}
      </p>
    </div>
  );
}
