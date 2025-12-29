/**
 * Dashboard layout - protected route with auth guard.
 *
 * Redirects unauthenticated users to sign-in page.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session from server-side auth instance
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Auth guard - redirect to sign-in if not authenticated
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Todo Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              User ID: {session.user.id}
            </span>
            <form action={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/");
            }}>
              <button
                type="submit"
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
