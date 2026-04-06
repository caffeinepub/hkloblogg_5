import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLang } from "../locales/LanguageContext";
import { translations } from "../locales/translations";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.97 0.01 220) 0%, oklch(0.95 0.02 210) 50%, oklch(0.96 0.015 230) 100%)",
      }}
    >
      {/* Decorative background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url('/assets/uploads/20260319_111140-1.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.12,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border p-8">
          {/* Logo & title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <svg
                role="img"
                aria-label="Blog icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-7 h-7 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-foreground mb-1">
              HKLOblogg
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.tagline}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t.tagline2}
            </p>
          </div>

          {/* Login section */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-1">
              {t.welcome}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{t.loginDesc}</p>
            <Button
              data-ocid="login.submit_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full"
              size="lg"
            >
              {isLoggingIn ? t.loggingIn : t.loginButton}
            </Button>
            <p className="text-xs text-muted-foreground/70 mt-3 text-center">
              {t.newUser}{" "}
              <a
                href="https://identity.ic0.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t.createIdentity}
              </a>
            </p>
          </div>

          {/* Info sections */}
          <div className="space-y-4 border-t border-border pt-6">
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                {t.transparencyTitle}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.transparencyText}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                {t.gdprTitle}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.gdprText}
                <span className="font-medium">{t.gdprIcp}</span>
                {t.gdprText2}
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          {t.footerBuilt}
        </p>
      </motion.div>
    </div>
  );
}
