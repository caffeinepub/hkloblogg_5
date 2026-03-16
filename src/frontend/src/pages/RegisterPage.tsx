import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegister } from "../hooks/useQueries";

function getErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("already registered") ||
    msg.includes("User already registered")
  ) {
    // Profile exists in backend but cache missed -- trigger a reload so App.tsx picks it up
    return "__ALREADY_REGISTERED__";
  }
  if (msg.includes("Alias already taken") || msg.includes("already taken")) {
    return "Det visningsnamnet är redan taget. Välj ett annat.";
  }
  if (msg.includes("Inte inloggad")) {
    return "Du är inte inloggad. Försök logga in igen.";
  }
  return "Något gick fel. Försök igen.";
}

export default function RegisterPage() {
  const { clear } = useInternetIdentity();
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = alias.trim();
    if (!trimmed) {
      setError("Ange ett visningsnamn.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Visningsnamnet måste vara minst 2 tecken.");
      return;
    }
    setError("");
    try {
      await register.mutateAsync(trimmed);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg === "__ALREADY_REGISTERED__") {
        // Force profile reload -- invalidate query and let App.tsx redirect
        setAlreadyRegistered(true);
        register.reset();
        // Trigger a page reload to re-fetch profile from backend
        window.location.reload();
        return;
      }
      setError(msg);
    }
  };

  if (alreadyRegistered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Laddar din profil…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <span className="font-display text-xl text-foreground">
            HKLOblogg
          </span>
        </div>
        <Button
          data-ocid="register.cancel_button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-muted-foreground"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logga ut
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl p-8 shadow-card">
            <h1 className="font-display text-2xl text-foreground mb-1">
              Skapa profil
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Välj ett visningsnamn som visas på dina inlägg och kommentarer.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="alias" className="text-sm font-medium">
                  Visningsnamn
                </Label>
                <Input
                  id="alias"
                  data-ocid="register.input"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="ditt-namn"
                  maxLength={32}
                  autoFocus
                  autoComplete="nickname"
                  className="h-10"
                />
                {error && (
                  <p
                    data-ocid="register.error_state"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>

              <Button
                data-ocid="register.submit_button"
                type="submit"
                className="w-full h-10"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrerar…
                  </>
                ) : (
                  "Registrera"
                )}
              </Button>
            </form>
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
