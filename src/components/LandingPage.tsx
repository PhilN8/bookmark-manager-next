import React from "react";
import Link from "next/link";
import {
  Bookmark,
  Sparkles,
  Shield,
  Zap,
  FolderTree,
  Search,
  ArrowRight,
  Github,
  Twitter,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-linear-to-br from-primary to-ring rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Bookmark className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Pearl</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#vision"
              className="hover:text-foreground transition-colors"
            >
              Vision
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex text-sm font-medium"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full px-5 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-md hover:shadow-lg"
            >
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 lg:pt-56 lg:pb-48">
        {/* Ambient background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-150 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-ring blur-[100px] rounded-full delay-700" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              New: Collaborative Workspaces
            </span>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </div>

          <h1 className="text-5xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Your personal library,
            <br />
            <span className="text-muted-foreground font-medium italic">
              beautifully organized.
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            Pearl is the bookmark manager for deep thinkers and obsessive
            collectors. Save everything, find it instantly, and keep your
            digital life clean.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Button
              size="lg"
              asChild
              className="h-14 px-10 rounded-full text-base font-semibold bg-linear-to-r from-primary to-ring shadow-2xl hover:shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              <Link href="/register">
                Start Collecting Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-14 px-10 rounded-full text-base font-semibold border-border bg-card/50 backdrop-blur-sm hover:bg-accent transition-all"
            >
              <Link href="/login">View Demo</Link>
            </Button>
          </div>

          {/* Product Preview Mockup */}
          <div className="mt-24 relative max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-[3rem] -z-10" />
            <div className="bg-card border border-border/60 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-4 lg:p-6 overflow-hidden">
              <div className="bg-background rounded-3xl border border-border shadow-inner overflow-hidden aspect-video flex">
                {/* Mock Sidebar */}
                <div className="w-1/4 border-r border-border p-6 hidden md:flex flex-col gap-8 text-left">
                  <div className="space-y-4">
                    <div className="h-4 w-24 bg-muted rounded-full" />
                    <div className="h-4 w-32 bg-muted rounded-full opacity-60" />
                    <div className="h-4 w-28 bg-muted rounded-full opacity-60" />
                  </div>
                  <div className="space-y-4 mt-auto">
                    <div className="h-4 w-32 bg-muted rounded-full opacity-40" />
                    <div className="h-8 w-8 bg-muted rounded-lg opacity-40" />
                  </div>
                </div>
                {/* Mock Content */}
                <div className="flex-1 p-8 text-left space-y-8 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="h-10 w-64 bg-muted/40 rounded-xl" />
                    <div className="h-10 w-10 bg-muted/40 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-4/3 bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm"
                      >
                        <div className="h-3 w-16 bg-primary/10 rounded-full" />
                        <div className="h-4 w-full bg-muted rounded-full" />
                        <div className="h-4 w-2/3 bg-muted rounded-full opacity-60" />
                        <div className="mt-auto pt-4 flex gap-2">
                          <div className="h-5 w-12 bg-muted/40 rounded-lg" />
                          <div className="h-5 w-12 bg-muted/40 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────────────── */}
      <section
        id="features"
        className="py-32 bg-secondary/30 relative overflow-hidden"
      >
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Designed for digital perfectionists.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We've stripped away the noise to give you a tool that feels like
              an extension of your mind. Fast, fluid, and focused.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Layers className="w-6 h-6" />}
              title="Workspaces"
              description="Keep your personal links separate from work, research, or hobbies. Scoped search per workspace."
            />
            <FeatureCard
              icon={<FolderTree className="w-6 h-6" />}
              title="Nested Folders"
              description="Infinite hierarchy for the taxonomically obsessed. Organize exactly the way you think."
            />
            <FeatureCard
              icon={<Search className="w-6 h-6" />}
              title="Instant Search"
              description="Blazing fast search that understands tags, folders, and titles. Never lose a link again."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Privacy First"
              description="Your data is yours. Secure JWT-based authentication and private-by-default collection."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Keyboard Friendly"
              description="Optimized workflows for power users. Manage your entire library without touching the mouse."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Pearl Design"
              description="A minimal, characterful aesthetic that makes organizing your library a meditative experience."
            />
          </div>
        </div>
      </section>

      {/* ── Vision Section ─────────────────────────────────────────────── */}
      <section id="vision" className="py-32">
        <div className="container mx-auto px-6">
          <div className="bg-foreground text-background rounded-[3rem] p-12 lg:p-24 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-white/10 to-transparent z-0" />

            <div className="flex-1 relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-8">
                The digital junk drawer is over.
              </h2>
              <p className="text-lg opacity-80 leading-relaxed mb-10">
                Most bookmark managers are where links go to die. Pearl is
                designed to be a living library — a place where you actually
                return to rediscover and learn. We believe software should be as
                beautiful as the ideas it stores.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8 font-semibold"
              >
                Learn our Story
              </Button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 relative z-10">
              <div className="h-64 bg-background/10 backdrop-blur-sm rounded-3xl border border-white/10 flex items-center justify-center p-8 text-center">
                <p className="text-2xl font-bold tracking-tighter italic">
                  "Elegance is the only beauty that never fades."
                </p>
              </div>
              <div className="h-64 mt-12 bg-background/10 backdrop-blur-sm rounded-3xl border border-white/10 flex items-center justify-center">
                <Bookmark className="w-16 h-16 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 border-t border-border/40">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-8">
            Ready to clear the clutter?
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Join thousands of collectors who trust Pearl with their digital
            discovery.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="h-14 px-12 rounded-full text-base font-semibold bg-primary text-primary-foreground shadow-xl hover:shadow-primary/20 transition-all"
            >
              <Link href="/register">Get Started Now</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground italic">
            No credit card required. Free forever plan included.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-20 border-t border-border/40 bg-secondary/20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                  <Bookmark className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold tracking-tight">Pearl</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A minimalist space for your digital treasures. Built with
                precision, designed for focus.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-24">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-6">
                  Product
                </h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-foreground">
                      Changelog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground">
                      API Docs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground">
                      Browser Extension
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-6">
                  Company
                </h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-foreground">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-6">
                  Social
                </h4>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-border/20 text-xs text-muted-foreground font-medium">
            <p>© 2026 Pearl Bookmark Manager. Built with Geist.</p>
            <div className="flex gap-8 mt-4 sm:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-10 rounded-[2.5rem] bg-card border border-border/50 hover:border-primary/20 hover:shadow-2xl hover:shadow-black/2 transition-all duration-500">
      <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
