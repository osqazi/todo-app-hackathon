"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth/helpers";
import { useRouter } from "next/navigation";

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
        <h1 className="text-xl font-bold text-gray-900">Todo Dashboard</h1>
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
