"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/features/shared";
import { Input } from "@/features/shared/components/ui/input";
import { Button } from "@/features/shared/components/ui/button";
import { Suspense } from "react"
import { Metadata } from "next"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let result;
    if (isSignUp) {
      result = await getSupabaseClient().auth.signUp({ email, password });
    } else {
      result = await getSupabaseClient().auth.signInWithPassword({ email, password });
    }
    if (result.error) setError(result.error.message);
    else {
      // Get user metadata to check for admin
      const { data } = await getSupabaseClient().auth.getUser();
      if (data.user?.app_metadata?.role === "super-admin") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center mb-2">{isSignUp ? "Sign Up" : "Sign In"}</h1>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
} 