/**
 * Sign-up page with vibrant dark theme registration.
 */

"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth/helpers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VibrantButton } from "@/components/ui/vibrant/VibrantButton";
import { VibrantCard, VibrantCardHeader, VibrantCardTitle, VibrantCardContent } from "@/components/ui/vibrant/VibrantCard";
import { VibrantInput } from "@/components/ui/vibrant/VibrantInput";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }

      // Attempt signup
      console.log("Sign-up attempt for:", email, name);
      const result = await signUp({
        email,
        password,
        name,
      });

      console.log("Sign-up result:", result);

      if (result.error) {
        console.error("Sign-up error:", result.error);
        setError(result.error.message || "Failed to create account");
        setLoading(false);
        return;
      }

      console.log("Sign-up successful, redirecting to dashboard...");
      // Success - redirect to dashboard with window.location for full reload
      window.location.href = "/dashboard";
    } catch (err) {
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
              Create Account
            </VibrantCardTitle>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Join us to start managing your tasks
            </p>
          </VibrantCardHeader>
          <VibrantCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <VibrantInput
                  id="name"
                  type="text"
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full"
                />
              </div>

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
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full"
                />
              </div>

              <div>
                <VibrantInput
                  id="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
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
                {loading ? "Creating account..." : "Create Account"}
              </VibrantButton>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
                Sign in
              </Link>
            </div>
          </VibrantCardContent>
        </VibrantCard>
      </div>
    </main>
  );
}
