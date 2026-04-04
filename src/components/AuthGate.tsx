"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!signedIn) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">登录</h1>

        <input
          className="border rounded px-3 py-2 w-full max-w-sm"
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border rounded px-3 py-2 w-full max-w-sm"
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="border rounded px-4 py-2"
          onClick={handleSignIn}
        >
          登录
        </button>

        {errorMessage && (
          <div className="text-sm text-red-500">{errorMessage}</div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <button className="border rounded px-3 py-1" onClick={handleSignOut}>
          退出登录
        </button>
      </div>
      {children}
    </>
  );
}
