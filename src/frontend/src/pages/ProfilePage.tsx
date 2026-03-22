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
import { useLang } from "../locales/LanguageContext";
import { translations } from "../locales/translations";

interface ProfilePageProps {
  profile: UserProfile | null;
  onBack: () => void;
  onLogout: () => void;
}

function RegisterForm({ onBack }: { onBack: () => void }) {
  const register = useRegister();
  const { lang } = useLang();
  const t = translations[lang];
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = alias.trim();
    if (trimmed.length < 2) {
      setError(t.aliasRequired);
      return;
    }
    if (trimmed.length > 32) {
      setError(t.aliasRequired);
      return;
    }
    try {
      await register.mutateAsync(trimmed);
      toast.success(t.saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("taken") ||
        msg.toLowerCase().includes("already")
      ) {
        setError(t.aliasAlreadyTaken);
      } else if (
        msg.toLowerCase().includes("too short") ||
        msg.toLowerCase().includes("short")
      ) {
        setError(t.aliasRequired);
      } else {
        setError(t.errorOccurred);
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
            {t.back}
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              {t.blogTitle}
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
              {t.welcomeToHKLO}
            </h1>
            <p className="text-muted-foreground">{t.chooseDisplayName}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-display text-lg text-foreground">
                  {t.createAccount}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.displayNameVisible}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-alias">{t.displayName}</Label>
                <Input
                  id="register-alias"
                  data-ocid="profile.register.input"
                  value={alias}
                  onChange={(e) => {
                    setAlias(e.target.value);
                    setError("");
                  }}
                  placeholder={t.displayNamePlaceholder}
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
                {t.register}
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
          {t.footerBuilt}
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
  const { lang } = useLang();
  const t = translations[lang];
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
      toast.success(t.accountDeleted);
      setDialogOpen(false);
      onLogout();
    } catch {
      toast.error(t.errorOccurred);
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
            {t.back}
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              {t.blogTitle}
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
          <h1 className="font-display text-3xl text-foreground">
            {t.myProfile}
          </h1>

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
                    {isAdmin ? t.admin : t.user}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t.registered} {registeredDate}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                {t.accountInfo}
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">{t.displayName}</span>
                <span className="text-foreground font-medium">
                  {profile.alias}
                </span>
                <span className="text-muted-foreground">{t.role}</span>
                <span className="text-foreground">
                  {isAdmin ? t.roleAdmin : t.roleUser}
                </span>
                <span className="text-muted-foreground">{t.registered}</span>
                <span className="text-foreground">{registeredDate}</span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-card border border-destructive/30 rounded-xl p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-destructive text-sm">
              {t.dangerZone}
            </h3>
            <p className="text-sm text-muted-foreground">{t.dangerZoneDesc}</p>

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
                  {t.deleteAccount}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="profile.delete_account.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.deleteAccount}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.deleteAccountWarning} {t.deleteAccountConfirm}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Label
                    htmlFor="confirm-alias"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    {t.yourDisplayName}:{" "}
                    <span className="font-semibold text-foreground">
                      {profile.alias}
                    </span>
                  </Label>
                  <Input
                    id="confirm-alias"
                    data-ocid="profile.delete_account.input"
                    value={confirmAlias}
                    onChange={(e) => setConfirmAlias(e.target.value)}
                    placeholder={`${t.typeAliasToConfirm}: "${profile.alias}"`}
                    autoComplete="off"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-ocid="profile.delete_account.cancel_button"
                    onClick={() => setConfirmAlias("")}
                  >
                    {t.cancel}
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
                    {t.confirmDeleteAccount}
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
          {t.footerBuilt}
        </a>
      </footer>
    </div>
  );
}
