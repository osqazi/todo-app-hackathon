/**
 * Dashboard layout - protected route with auth guard.
 *
 * Redirects unauthenticated users to sign-in page.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import DashboardHeader from "@/components/DashboardHeader";

// Force dynamic rendering to avoid build-time auth calls
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let sessionResult = null;

  // Get session from server-side auth instance
  // Skip during build time
  try {
    sessionResult = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    // During build, this will fail - redirect to sign-in
    console.log("Auth check skipped during build");
    redirect("/sign-in");
  }

  // Auth guard - redirect to sign-in if not authenticated
  // Better Auth returns { session: {...}, user: {...} }
  if (!sessionResult?.session || !sessionResult?.user) {
    redirect("/sign-in");
  }

  const session = sessionResult.session;
  const user = sessionResult.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <DashboardHeader user={user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
