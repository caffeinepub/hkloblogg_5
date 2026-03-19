import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, Loader2, Trash2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import type { UserProfile } from "../backend.d";
import { useDeleteMyAccount, useRegister } from "../hooks/useQueries";

interface ProfilePageProps {
  profile: UserProfile | null;
  onBack: () => void;
  onLogout: () => void;
}

function RegisterForm({ onBack }: { onBack: () => void }) {
  const register = useRegister();
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = alias.trim();
    if (trimmed.length < 2) {
      setError("Visningsnamnet måste vara minst 2 tecken.");
      return;
    }
    if (trimmed.length > 32) {
      setError("Visningsnamnet får vara högst 32 tecken.");
      return;
    }
    try {
      await register.mutateAsync(trimmed);
      toast.success("Välkommen! Ditt visningsnamn är nu sparat.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("taken") ||
        msg.toLowerCase().includes("already")
      ) {
        setError("Det visningsnamnet är redan taget. Välj ett annat.");
      } else if (
        msg.toLowerCase().includes("too short") ||
        msg.toLowerCase().includes("short")
      ) {
        setError("Visningsnamnet är för kort.");
      } else {
        setError("Något gick fel. Försök igen.");
      }
    }
  };

  return (
    <div className="min-h-screen leaf-bg-page flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            data-ocid="profile.back.button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Tillbaka
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              HKLOblogg
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <div>
            <h1 className="font-display text-3xl text-foreground mb-2">
              Välkommen till HKLOblogg
            </h1>
            <p className="text-muted-foreground">
              Välj ett visningsnamn för att komma igång.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-display text-lg text-foreground">
                  Skapa ditt konto
                </h2>
                <p className="text-sm text-muted-foreground">
                  Visningsnamnet syns på alla dina inlägg och kommentarer.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-alias">Visningsnamn</Label>
                <Input
                  id="register-alias"
                  data-ocid="profile.register.input"
                  value={alias}
                  onChange={(e) => {
                    setAlias(e.target.value);
                    setError("");
                  }}
                  placeholder="Ditt namn eller alias (2–32 tecken)"
                  autoComplete="off"
                  autoFocus
                  maxLength={32}
                />
                {error && (
                  <p
                    data-ocid="profile.register.error_state"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </div>
              <Button
                data-ocid="profile.register.submit_button"
                type="submit"
                className="w-full"
                disabled={register.isPending || alias.trim().length < 2}
              >
                {register.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Registrera
              </Button>
            </form>
          </div>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border leaf-bg-footer">
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

export default function ProfilePage({
  profile,
  onBack,
  onLogout,
}: ProfilePageProps) {
  const deleteMyAccount = useDeleteMyAccount();
  const [confirmAlias, setConfirmAlias] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!profile) {
    return <RegisterForm onBack={onBack} />;
  }

  const isAdmin = profile.role === UserRole.admin;
  const registeredDate = new Date(
    Number(profile.registeredAt) / 1_000_000,
  ).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const aliasMatches = confirmAlias.trim() === profile.alias;

  const handleDeleteAccount = async () => {
    if (!aliasMatches) return;
    try {
      await deleteMyAccount.mutateAsync();
      toast.success("Ditt konto har raderats.");
      setDialogOpen(false);
      onLogout();
    } catch {
      toast.error("Kunde inte radera kontot. Försök igen.");
    }
  };

  return (
    <div className="min-h-screen leaf-bg-page flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            data-ocid="profile.back.button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Tillbaka
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              HKLOblogg
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <h1 className="font-display text-3xl text-foreground">Min profil</h1>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl text-foreground">
                    {profile.alias}
                  </h2>
                  <Badge
                    variant={isAdmin ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isAdmin ? "Admin" : "Användare"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Registrerad {registeredDate}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Kontoinformation
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Visningsnamn</span>
                <span className="text-foreground font-medium">
                  {profile.alias}
                </span>
                <span className="text-muted-foreground">Roll</span>
                <span className="text-foreground">
                  {isAdmin ? "Administratör" : "Användare"}
                </span>
                <span className="text-muted-foreground">Registrerad</span>
                <span className="text-foreground">{registeredDate}</span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-card border border-destructive/30 rounded-xl p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-destructive text-sm">
              Farlig zon
            </h3>
            <p className="text-sm text-muted-foreground">
              Att radera ditt konto är permanent och kan inte ångras. Alla dina
              inlägg och kommentarer kommer att raderas.
            </p>

            <AlertDialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setConfirmAlias("");
              }}
            >
              <AlertDialogTrigger asChild>
                <Button
                  data-ocid="profile.delete_account.button"
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Radera mitt konto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="profile.delete_account.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Radera ditt konto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta raderar ditt konto och alla dina inlägg och
                    kommentarer permanent. Skriv in ditt visningsnamn för att
                    bekräfta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Label
                    htmlFor="confirm-alias"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Ditt visningsnamn:{" "}
                    <span className="font-semibold text-foreground">
                      {profile.alias}
                    </span>
                  </Label>
                  <Input
                    id="confirm-alias"
                    data-ocid="profile.delete_account.input"
                    value={confirmAlias}
                    onChange={(e) => setConfirmAlias(e.target.value)}
                    placeholder={`Skriv "${profile.alias}" för att bekräfta`}
                    autoComplete="off"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-ocid="profile.delete_account.cancel_button"
                    onClick={() => setConfirmAlias("")}
                  >
                    Avbryt
                  </AlertDialogCancel>
                  <Button
                    data-ocid="profile.delete_account.confirm_button"
                    variant="destructive"
                    disabled={!aliasMatches || deleteMyAccount.isPending}
                    onClick={handleDeleteAccount}
                  >
                    {deleteMyAccount.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Radera
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border leaf-bg-footer">
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
