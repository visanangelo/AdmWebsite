"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, Input, Button } from "@/features/shared";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  // Cleanup any lingering UI states on mount
  useEffect(() => {
    // Reset body overflow and any potential overlays
    document.body.style.overflow = 'unset'
    document.body.style.position = 'static'
    
    // Remove any potential backdrop overlays
    const overlays = document.querySelectorAll('[class*="overlay"], [class*="backdrop"]')
    overlays.forEach(overlay => {
      if (overlay instanceof HTMLElement) {
        overlay.style.display = 'none'
        overlay.style.pointerEvents = 'none'
      }
    })
    
    // Force focus on first input for better mobile UX
    const firstInput = document.querySelector('input[type="email"]') as HTMLInputElement
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }
  }, [])

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
      if (data.user?.user_metadata?.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative z-10">
      <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md space-y-6 relative z-20">
        <h1 className="text-2xl font-bold text-center mb-2">{isSignUp ? "Sign Up" : "Sign In"}</h1>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          className="touch-manipulation"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete={isSignUp ? "new-password" : "current-password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          className="touch-manipulation"
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full touch-manipulation" disabled={loading}>
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm touch-manipulation"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
} 