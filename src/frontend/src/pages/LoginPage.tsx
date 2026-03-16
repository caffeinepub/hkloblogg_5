import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative top bar */}
      <div className="h-1 bg-primary w-full" />

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Logo + title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
              <BookOpen className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-4xl text-foreground mb-1">
              HKLOblogg
            </h1>
            <p className="text-muted-foreground text-sm">
              En plats för tankar och berättelser
            </p>
          </div>

          {/* Login card */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Välkommen
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Logga in med Internet Identity för att läsa och delta.
            </p>

            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full h-11"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loggar in…
                </>
              ) : (
                "Logga in med Internet Identity"
              )}
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Byggd med ❤ via caffeine.ai
        </a>
      </footer>
    </div>
  );
}
