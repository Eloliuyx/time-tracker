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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Check your email for the login link.");
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
        <h1 className="text-xl font-semibold">Sign in</h1>
        <input
          className="border rounded px-3 py-2 w-full max-w-sm"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="border rounded px-4 py-2"
          onClick={handleSignIn}
        >
          Send magic link
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <button className="border rounded px-3 py-1" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
      {children}
    </>
  );
}
