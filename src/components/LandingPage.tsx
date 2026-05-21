"use client";

import { useRef, useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const { language, t } = useI18n();
  const [aspectRatio, setAspectRatio] = useState("9 / 19");
  const videoRef = useRef<HTMLVideoElement>(null);

  const demoSrc = language === "zh" ? "/demo-zh.mp4" : "/demo-en.mp4";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full max-w-lg mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.png"
            alt={t.appName}
            className="w-7 h-7 dark:invert"
          />
          <span className="text-base font-medium tracking-tight">
            {t.appName}
          </span>
        </div>

        <LanguageToggle />
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 pb-8 flex flex-col justify-center gap-8">
        <section className="text-center pt-4">
          <p className="mb-3 text-sm text-muted">{t.landing.eyebrow}</p>

          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            {t.landing.title}
          </h1>

          <p className="mt-4 text-base leading-7 text-muted">
            {t.landing.subtitle}
          </p>
        </section>

        <section className="mx-auto w-full max-w-[340px]">
          <div className="rounded-[2.25rem] border border-border bg-surface p-3 shadow-sm">
            <div
              className="overflow-hidden rounded-[1.75rem] bg-surface-soft border border-border"
              style={{ aspectRatio }}
            >
                <video
  ref={videoRef}
  key={demoSrc}
  className="h-full w-full object-contain"
  src={demoSrc}
  autoPlay
  muted
  loop
  playsInline
  onLoadedMetadata={(event) => {
    const video = event.currentTarget;

    video.playbackRate = 1.2;

    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
    }
  }}
/>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onEnter}
            className="h-12 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black text-base font-medium transition-opacity active:opacity-80"
          >
            {t.landing.authButton}
          </button>

          <p className="mx-auto max-w-[34rem] text-sm font-medium leading-6 text-zinc-700 dark:text-zinc-200">
  {t.landing.footer}
</p>
        </section>
      </main>
    </div>
  );
}
