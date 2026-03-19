import { Button } from "@/components/ui/button";
import { BookOpen, Eye, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen leaf-bg-login flex flex-col">
      {/* Decorative top bar */}
      <div className="h-1 bg-primary w-full" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Logo + title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
              <BookOpen className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-4xl text-foreground mb-1">
              HKLOblogg
            </h1>
            <p className="text-muted-foreground text-sm">
              En plattform för åsiktsfrihet, yttrandefrihet och respektfull
              dialog
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              – med fokus på integritet och GDPR
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

            <p className="text-xs text-muted-foreground text-center mt-4">
              Ny användare?{" "}
              <a
                href="https://identity.ic0.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Skapa ett Internet Identity här
              </a>
            </p>
          </div>

          {/* Transparency notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-5 bg-muted/50 border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Transparens
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bloggen drivs på Internet Computer Protocol (ICP), en
              decentraliserad blockkedja. Det innebär att plattformens kod och
              data är driftsatt på ICP och kan verifieras -- ingen enskild part
              kontrollerar eller kan manipulera infrastrukturen.
            </p>
          </motion.div>

          {/* GDPR clarification */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 bg-muted/50 border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Förtydligande – Rätten att bli glömd
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Du har rätt att bli glömd – Du kan själv radera ditt konto, och
              alla dina inlägg och kommentarer kommer att tas bort från
              HKLO-bloggens synliga gränssnitt. Observera dock att eftersom
              innehållet lagras på{" "}
              <strong className="text-foreground">
                Internet Computer Protocol (ICP)
              </strong>
              , en typ av blockkedja, är det tekniskt omöjligt att helt radera
              information som en gång har skrivits in i blockkedjan. Det innebär
              att innehållet kan finnas kvar i blockkedjans historik, men det
              kommer inte längre att vara tillgängligt eller synligt för andra
              användare på HKLO-bloggen.
            </p>
          </motion.div>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground leaf-bg-footer">
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
