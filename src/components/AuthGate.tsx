"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "signIn" | "signUp";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setSignedIn(!!user);
      setLoading(false);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignIn() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setErrorMessage("请输入邮箱和密码。");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
  }

  async function handleSignUp() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setErrorMessage("请输入邮箱和密码。");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("密码至少需要 6 位。");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      setInfoMessage("注册成功，已自动登录。");
      return;
    }

    setInfoMessage("注册成功。请检查邮箱，点击确认链接后再登录。");
    setMode("signIn");
  }

  async function handleSubmit() {
    if (mode === "signIn") {
      await handleSignIn();
    } else {
      await handleSignUp();
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Loading...
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center">
              <img
                src="/logo.svg"
                alt="时间沙漏"
                className="h-8 w-8 dark:invert"
              />
            </div>

            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              时间沙漏
            </h1>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {mode === "signIn"
                ? "极简 | 倒叙式 | 时间开销"
                : "极简 | 倒叙式 | 时间开销"}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/20 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signIn");
                setErrorMessage("");
                setInfoMessage("");
              }}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                mode === "signIn"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              登录
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signUp");
                setErrorMessage("");
                setInfoMessage("");
              }}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                mode === "signUp"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              注册
            </button>
          </div>

          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              type="email"
              placeholder="邮箱"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              type="password"
              placeholder={mode === "signUp" ? "密码，至少 6 位" : "密码"}
              value={password}
              autoComplete={
                mode === "signIn" ? "current-password" : "new-password"
              }
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />

            <button
              className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-medium text-white dark:text-zinc-900 disabled:opacity-40"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? "处理中..."
                : mode === "signIn"
                ? "登录"
                : "注册"}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-black/20 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
              {infoMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end bg-zinc-50 dark:bg-black px-4 pt-4">
        <button
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          onClick={handleSignOut}
        >
          退出登录
        </button>
      </div>

      {children}
    </>
  );
}
