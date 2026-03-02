"use client";

import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Create the auth client
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Create context
const AuthContext = createContext<{
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}>({
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
