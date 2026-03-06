"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError("");
    setIsLoading(true);

    try {
      await authApi.signIn(values.email, values.password);

      toast.success("Welcome back!", {
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-center gap-3 mb-10 group cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-12 h-12 bg-linear-to-br from-primary to-ring rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Bookmark className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pearl</h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Bookmark Manager</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5 dark:shadow-white/5 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-8 pt-10 px-8">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-sm">Enter your credentials to access your library</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl animate-in shake-in duration-300">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  disabled={isLoading}
                  className={cn(
                    "h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all",
                    errors.email && "border-destructive/50 focus:ring-destructive/20"
                  )}
                />
                {errors.email && (
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider ml-1 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all pr-12",
                      errors.password && "border-destructive/50 focus:ring-destructive/20"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-4 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider ml-1 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-linear-to-r from-primary to-ring hover:opacity-90 font-bold tracking-tight shadow-md hover:shadow-lg transition-all" 
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button 
                  className="font-bold text-primary hover:underline underline-offset-4 decoration-2" 
                  onClick={() => router.push("/register")}
                >
                  Create an account
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
