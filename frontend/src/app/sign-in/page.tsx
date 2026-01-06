/**
 * Sign-in page with vibrant dark theme authentication.
 */

"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "@/lib/auth/helpers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VibrantButton } from "@/components/ui/vibrant/VibrantButton";
import { VibrantCard, VibrantCardHeader, VibrantCardTitle, VibrantCardContent } from "@/components/ui/vibrant/VibrantCard";
import { VibrantInput } from "@/components/ui/vibrant/VibrantInput";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session?.data) {
          router.push("/dashboard");
        }
      } catch (error) {
        // If there's an error getting session, continue to sign-in page
        console.log("Session check failed, showing sign-in page");
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Sign-in attempt for:", email);
      const result = await signIn({
        email,
        password,
      });

      console.log("Sign-in result:", result);

      if (result.error) {
        console.error("Sign-in error:", result.error);
        setError(result.error.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      console.log("Sign-in successful, redirecting to dashboard...");
      // Success - use window.location to ensure full page reload with new session
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Sign-in exception:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <div className="w-full max-w-md">
        <VibrantCard className="animate-fade-in">
          <VibrantCardHeader className="text-center">
            <VibrantCardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Welcome Back
            </VibrantCardTitle>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Sign in to your account to continue
            </p>
          </VibrantCardHeader>
          <VibrantCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <VibrantInput
                  id="email"
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full"
                />
              </div>

              <div>
                <VibrantInput
                  id="password"
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="w-full"
                />
              </div>

              {error && (
                <div className="notification notification-error rounded-lg p-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <VibrantButton
                type="submit"
                loading={loading}
                className="w-full py-3 text-base font-semibold"
              >
                {loading ? "Signing in..." : "Sign In"}
              </VibrantButton>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
                Sign up
              </Link>
            </div>
          </VibrantCardContent>
        </VibrantCard>
      </div>
    </main>
  );
}
