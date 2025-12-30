/**
 * Auth Context for managing authentication state.
 *
 * Provides authentication methods and user session to all components.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getSession,
} from "@/lib/auth/helpers";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthError {
  code?: string;
  message?: string;
  status: number;
  statusText: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const session = await getSession();
      // Better-auth returns session with user object
      if (session?.data?.user) {
        setUser({
          id: session.data.user.id,
          email: session.data.user.email,
          name: session.data.user.name || undefined,
          image: session.data.user.image || undefined,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await authSignIn({ email, password });
    if (result.error) {
      const authError = result.error as AuthError;
      return { error: { message: authError.message || "Sign in failed" } };
    }
    await loadSession();
    return {};
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await authSignUp({ email, password, name });
    if (result.error) {
      const authError = result.error as AuthError;
      return { error: { message: authError.message || "Sign up failed" } };
    }
    await loadSession();
    return {};
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
