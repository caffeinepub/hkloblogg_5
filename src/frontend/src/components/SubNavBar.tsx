import { Home, Menu, PenLine, Rss } from "lucide-react";

interface SubNavTranslations {
  home: string;
  myFeed: string;
  newPost: string;
  categories: string;
}

interface SubNavBarProps {
  hasProfile: boolean;
  activeCategoryName: string;
  onHome: () => void;
  onMyFeed: () => void;
  onCreatePost: () => void;
  onOpenCategories: () => void;
  showMyFeed: boolean;
  t?: SubNavTranslations;
}

const defaultT: SubNavTranslations = {
  home: "Hem",
  myFeed: "Mitt flöde",
  newPost: "Nytt inlägg",
  categories: "Kategorier",
};

export default function SubNavBar({
  hasProfile,
  activeCategoryName,
  onHome,
  onMyFeed,
  onCreatePost,
  onOpenCategories,
  showMyFeed,
  t = defaultT,
}: SubNavBarProps) {
  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-[65px] z-10">
      <div className="max-w-3xl mx-auto px-4 h-11 flex items-center justify-between gap-2">
        {/* Left: shortcut links */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            data-ocid="subnav.home.link"
            onClick={onHome}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">{t.home}</span>
          </button>

          {showMyFeed && (
            <button
              type="button"
              data-ocid="subnav.my_feed.link"
              onClick={onMyFeed}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            >
              <Rss className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t.myFeed}</span>
            </button>
          )}

          {hasProfile && (
            <button
              type="button"
              data-ocid="subnav.create_post.button"
              onClick={onCreatePost}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            >
              <PenLine className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t.newPost}</span>
            </button>
          )}
        </div>

        {/* Right: category chip + hamburger */}
        <div className="flex items-center gap-2">
          <span
            className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 max-w-[120px] truncate"
            title={activeCategoryName}
          >
            {activeCategoryName}
          </span>
          <button
            type="button"
            data-ocid="subnav.categories.open_modal_button"
            onClick={onOpenCategories}
            aria-label={t.categories}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation border border-border"
          >
            <Menu className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline text-muted-foreground">
              {t.categories}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
