import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Info, LogOut, Shield } from "lucide-react";
import { motion } from "motion/react";
import { UserRole } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin, useMyProfile } from "../hooks/useQueries";

interface DashboardProps {
  onAdminPanel: () => void;
}

export default function Dashboard({ onAdminPanel }: DashboardProps) {
  const { clear } = useInternetIdentity();
  const { data: profile } = useMyProfile();
  const { data: isAdmin } = useIsAdmin();

  const roleLabel = () => {
    if (isAdmin) return "Superadmin";
    if (profile?.role === UserRole.admin) return "Admin";
    return "Användare";
  };

  const roleBadgeVariant = isAdmin ? "default" : "secondary";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              HKLOblogg
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                data-ocid="dashboard.admin_panel.button"
                variant="outline"
                size="sm"
                onClick={onAdminPanel}
                className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              >
                <Shield className="w-3.5 h-3.5" />
                Adminpanel
              </Button>
            )}
            <Button
              data-ocid="dashboard.logout.button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Welcome card */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Välkommen tillbaka
                </p>
                <h1 className="font-display text-3xl text-foreground">
                  {profile?.alias}
                </h1>
              </div>
              <Badge
                data-ocid="dashboard.role.badge"
                variant={roleBadgeVariant}
                className="text-xs px-3 py-1"
              >
                {roleLabel()}
              </Badge>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Din principal-ID är kopplad till aliased{" "}
                <span className="font-medium text-foreground">
                  {profile?.alias}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Phase notice */}
          <Alert
            data-ocid="dashboard.phase.panel"
            className="border-primary/20 bg-primary/5"
          >
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground/80">
              <strong className="text-foreground">Fas 1 aktiv</strong> — inlägg
              och kommentarer kommer i nästa fas.
            </AlertDescription>
          </Alert>

          {/* Admin shortcut */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-6 shadow-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Adminpanel</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Hantera kategorier, användare och roller.
              </p>
              <Button
                data-ocid="dashboard.open_admin.button"
                onClick={onAdminPanel}
                size="sm"
                className="gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Öppna adminpanel
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>

      <footer className="py-5 text-center text-xs text-muted-foreground border-t border-border">
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
