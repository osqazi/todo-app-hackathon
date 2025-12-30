/**
 * Dashboard layout - protected route with auth guard.
 *
 * Redirects unauthenticated users to sign-in page.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import DashboardHeader from "@/components/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session from server-side auth instance
  const sessionResult = await auth.api.getSession({
    headers: await headers(),
  });

  // Auth guard - redirect to sign-in if not authenticated
  // Better Auth returns { session: {...}, user: {...} }
  if (!sessionResult?.session || !sessionResult?.user) {
    redirect("/sign-in");
  }

  const session = sessionResult.session;
  const user = sessionResult.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
