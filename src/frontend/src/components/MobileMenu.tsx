import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookOpen,
  LogOut,
  Menu,
  Rss,
  Search,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin, useMyProfile } from "../hooks/useQueries";

interface MobileMenuProps {
  hasProfile?: boolean;
  onMyFeed?: () => void;
  onProfile?: () => void;
  onAdminPanel?: () => void;
  onSearch?: (query: string) => void;
}

export default function MobileMenu({
  hasProfile = true,
  onMyFeed,
  onProfile,
  onAdminPanel,
  onSearch,
}: MobileMenuProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useMyProfile();
  const { data: isAdmin } = useIsAdmin();
  const [searchInput, setSearchInput] = useState("");
  const [open, setOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q && onSearch) {
      onSearch(q);
      setOpen(false);
    }
  };

  const handleNav = (fn?: () => void) => {
    setOpen(false);
    fn?.();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-ocid="nav.mobile_menu.button"
          aria-label="Öppna meny"
          className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        data-ocid="nav.mobile_menu.sheet"
        className="w-72 flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-5 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            HKLOblogg
          </SheetTitle>
        </SheetHeader>

        <Separator />

        <div className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {/* Search */}
          {onSearch && (
            <form onSubmit={handleSearch} className="mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  data-ocid="nav.mobile_search.input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Sök inlägg…"
                  className="pl-9 h-11 text-sm"
                />
              </div>
            </form>
          )}

          {/* Mitt flöde */}
          {identity && hasProfile && onMyFeed && (
            <button
              type="button"
              data-ocid="nav.mobile_my_feed.link"
              onClick={() => handleNav(onMyFeed)}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Rss className="w-4 h-4 shrink-0" />
              Mitt flöde
            </button>
          )}

          {/* Profil */}
          {identity && onProfile && (
            <button
              type="button"
              data-ocid="nav.mobile_profile.link"
              onClick={() => handleNav(onProfile)}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <User className="w-4 h-4 shrink-0" />
              {profile?.alias ?? "Profil"}
            </button>
          )}

          {/* Admin */}
          {isAdmin && onAdminPanel && (
            <button
              type="button"
              data-ocid="nav.mobile_admin.link"
              onClick={() => handleNav(onAdminPanel)}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Shield className="w-4 h-4 shrink-0" />
              Adminpanel
            </button>
          )}

          <Separator className="my-2" />

          {/* Logga ut */}
          {identity && (
            <button
              type="button"
              data-ocid="nav.mobile_logout.button"
              onClick={() => {
                setOpen(false);
                clear();
              }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logga ut
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
