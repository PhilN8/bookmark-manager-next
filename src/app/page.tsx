"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { LandingPage } from "@/components/LandingPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Always render LandingPage immediately for a seamless "first paint".
  // If the user is found to be logged in later, the useEffect will 
  // handle the redirect to the dashboard.
  return <LandingPage />;
}
