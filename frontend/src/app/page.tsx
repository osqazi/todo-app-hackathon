/**
 * Landing page - root route.

 * Displays navigation to sign-up/signin for unauthenticated users,
 * or redirects to dashboard for authenticated users.
 */

import Link from "next/link";
import { getSession } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";

// Force dynamic rendering to avoid build-time auth calls
export const dynamic = 'force-dynamic';

export default async function Home() {
  let session = null;

  // Skip session check during build time
  try {
    session = await getSession();
  } catch (error) {
    // During build, session check will fail - that's expected
    console.log("Session check skipped during build");
  }

  // Redirect authenticated users to dashboard
  if (session?.data) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Todo Application</h1>
      <p className="mb-8 text-lg text-gray-600">
        Manage your tasks with a full-stack authenticated application
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-up"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Sign Up
        </Link>
        <Link
          href="/sign-in"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
