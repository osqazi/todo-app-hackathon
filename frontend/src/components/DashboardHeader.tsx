"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth/helpers";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardHeaderProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Sign-out error:", error);
      setIsSigningOut(false);
    }
  };

  // Display name if available, otherwise email
  const displayName = user.name || user.email;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-900">Todo Dashboard</h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Tasks
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              AI Chat
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {displayName}
          </span>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </header>
  );
}
