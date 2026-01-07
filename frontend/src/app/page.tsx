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
    <main className="flex min-h-screen flex-col">
      {/* Hackathon Project Banner */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-slate-700/50 py-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-300">
            A Hackathon II Project of GIAIC - Q4
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse lg:flex-row min-h-screen">
        {/* Features Section - Left Side (will be bottom on mobile) */}
        <div className="lg:w-1/3 w-full lg:min-h-screen bg-gradient-to-b from-slate-800/30 to-slate-900/30 backdrop-blur-sm border-r border-slate-700/50 p-8 lg:p-12">
          <div className="sticky top-8">
            <h2 className="text-2xl font-bold mb-8 text-slate-100">
              Application Features:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Modern AI Assistant to maintain Tasks",
                "User Authentication & Authorization",
                "Create, Read, Update, Delete (CRUD) Tasks",
                "Mark Tasks as Complete/Incomplete",
                "Task Prioritization (High/Medium/Low)",
                "Categorize Tasks with Tags",
                "Search & Filter Tasks",
                "Sort Tasks (by date, priority, status)",
                "Set Due Dates & Reminders",
                "Recurring Tasks",
                "Responsive Design",
                "Dark/Light Theme Support",
                "Real-time Updates",
                "Secure Data Storage",
                "Multi-user Isolation"
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40 transition-all duration-300 group"
                >
                  <div className="flex-shrink-0 mt-2">
                    <svg
                      className="w-4 h-4 text-indigo-400 group-hover:text-purple-400 transition-colors duration-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <span className="text-slate-200 group-hover:text-white transition-colors duration-300 font-medium flex-1">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Right Side (will be top on mobile) */}
        <div className="lg:w-2/3 w-full flex items-center justify-center p-8 lg:p-24">
          <div className="max-w-2xl w-full text-center">
            {/* Application Icon */}
            <div className="flex justify-center mb-6">
              <img
                src="/logo.png"
                alt="Todo Application Logo"
                className="w-32 h-32 rounded-2xl"
                width={128}
                height={128}
              />
            </div>

            {/* Stylish Title with Developer Name */}
            <h1 className="text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Todo Application
              </span>
            </h1>

            {/* Developer Name */}
            <p className="text-lg lg:text-xl mb-4 text-slate-200 animate-fade-in font-medium">
              By <span className="font-bold text-white">Owais Qazi</span>, The Founder of <span className="font-bold text-white">MetaLog Inc</span>
            </p>

            {/* Catching Line */}
            <p className="text-xl lg:text-2xl mb-6 text-white font-bold leading-relaxed animate-fade-in">
              Streamline your daily routine and stay on top of important tasks with our powerful, intuitive todo application
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-semibold text-lg"
              >
                Get Started
              </Link>
              <Link
                href="/sign-in"
                className="px-8 py-4 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                Sign In
              </Link>
            </div>

            {/* Additional Info */}
            <p className="mt-8 text-slate-300 text-base font-medium">
              Join thousands of users who trust our platform to manage their productivity
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
