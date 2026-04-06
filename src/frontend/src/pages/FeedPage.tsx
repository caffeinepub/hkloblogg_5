import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Heart,
  Info,
  LogOut,
  MessageCircle,
  PenLine,
  Pin,
  Search,
  Shield,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Post } from "../backend.d";
import AuthorName from "../components/AuthorName";
import CategoryBottomSheet from "../components/CategoryBottomSheet";
import MobileMenu from "../components/MobileMenu";
import NotificationBell from "../components/NotificationBell";
import ScrollToTop from "../components/ScrollToTop";
import SubNavBar from "../components/SubNavBar";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useIsAdmin,
  useListCategories,
  useListComments,
  useListPosts,
  useMyLikedPosts,
  useMyProfile,
} from "../hooks/useQueries";
import { readTime } from "../lib/readTime";
import { useLang } from "../locales/LanguageContext";
import { translations } from "../locales/translations";
import type { Language } from "../locales/translations";

interface FeedPageProps {
  hasProfile?: boolean;
  onPost: (id: string) => void;
  onCreatePost: () => void;
  onAdminPanel: () => void;
  onSearch: (query: string) => void;
  onProfile: () => void;
  onMyFeed: () => void;
}

function CommentCount({ postId }: { postId: string }) {
  const { data: comments, isLoading } = useListComments(postId);
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <MessageCircle className="w-3.5 h-3.5" />
      {isLoading ? (
        <span className="opacity-40">-</span>
      ) : (
        (comments ?? []).length
      )}
    </span>
  );
}

function PostCard({
  post,
  categoryName,
  liked,
  onClick,
  index,
  pinnedLabel,
  lang,
}: {
  post: Post;
  categoryName: string;
  liked: boolean;
  onClick: () => void;
  index: number;
  pinnedLabel: string;
  lang: Language;
}) {
  const date = new Date(Number(post.createdAt) / 1_000_000);

  return (
    <motion.article
      data-ocid={`feed.post.item.${index}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {post.pinned && (
            <Badge
              variant="secondary"
              className="text-xs gap-1 bg-primary/10 text-primary border-primary/20"
            >
              <Pin className="w-3 h-3" />
              {pinnedLabel}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {categoryName}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm shrink-0">
          <Heart
            className={`w-4 h-4 ${
              liked ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
            }`}
          />
          <span className="text-muted-foreground text-xs">
            {post.likeCount.toString()}
          </span>
        </div>
      </div>

      <h2 className="font-display text-lg text-foreground group-hover:text-primary transition-colors leading-snug mb-1">
        {post.title}
      </h2>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 flex-wrap">
        <AuthorName principal={post.authorPrincipal} />
        <span>·</span>
        <CommentCount postId={post.id} />
        <span>·</span>
        <time dateTime={date.toISOString()}>
          {date.toLocaleDateString("sv-SE", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
        <span>·</span>
        <span>{readTime(post.body, lang as Language)}</span>
      </div>
    </motion.article>
  );
}

export default function FeedPage({
  hasProfile = true,
  onPost,
  onCreatePost,
  onAdminPanel,
  onSearch,
  onProfile,
  onMyFeed,
}: FeedPageProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useMyProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: categories } = useListCategories();
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const { data: posts, isLoading } = useListPosts(activeCatId);
  const { data: likedPosts } = useMyLikedPosts();
  const [searchInput, setSearchInput] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { lang } = useLang();
  const t = translations[lang];

  const likedSet = new Set(likedPosts ?? []);

  const sorted = [...(posts ?? [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return Number(b.createdAt - a.createdAt);
  });

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const activeCategoryName = activeCatId
    ? (catMap.get(activeCatId) ?? t.allPosts)
    : t.allPosts;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) onSearch(q);
  };

  const showProfileBanner = !!identity && !hasProfile;

  const notifT = {
    notifications: t.notifications,
    markAllRead: t.markAllRead,
    noNotifications: t.noNotifications,
    newComment: t.newComment,
    newReply: t.newReply,
    newMedia: t.newMedia,
    newEvent: t.newEvent,
    justNow: t.justNow,
    minutesAgo: t.minutesAgo,
    hoursAgo: t.hoursAgo,
    daysAgo: t.daysAgo,
    postLabel: t.postLabel,
  };

  return (
    <div className="min-h-screen leaf-bg-page flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground border-b-2 border-primary pb-0.5">
              {t.blogTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search – desktop only */}
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex items-center"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  data-ocid="feed.search.input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="pl-8 h-8 w-40 text-sm"
                />
              </div>
            </form>

            {/* Notification bell */}
            {identity && hasProfile && (
              <NotificationBell onPost={onPost} t={notifT} />
            )}

            {/* Profile button – desktop */}
            {profile && (
              <button
                type="button"
                data-ocid="feed.profile.button"
                onClick={onProfile}
                className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <User className="w-3.5 h-3.5" />
                <span>{profile.alias}</span>
              </button>
            )}
            {!hasProfile && identity && (
              <button
                type="button"
                data-ocid="feed.profile.button"
                onClick={onProfile}
                className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.profileLabel}</span>
              </button>
            )}

            {/* Admin panel – desktop */}
            {isAdmin && (
              <Button
                data-ocid="feed.admin_panel.button"
                variant="outline"
                size="sm"
                onClick={onAdminPanel}
                className="hidden sm:flex gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t.adminPanel}</span>
              </Button>
            )}

            {/* Logout – desktop */}
            <Button
              data-ocid="feed.logout.button"
              variant="ghost"
              size="sm"
              onClick={clear}
              aria-label={t.logout}
              className="hidden sm:flex text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile hamburger menu */}
            <MobileMenu
              hasProfile={hasProfile}
              onMyFeed={onMyFeed}
              onProfile={onProfile}
              onAdminPanel={onAdminPanel}
              onSearch={onSearch}
            />
          </div>
        </div>
      </header>

      {/* New user welcome banner */}
      {showProfileBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          data-ocid="feed.profile_banner.panel"
          className="bg-blue-50 border-b border-blue-200"
        >
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">{t.welcomeBanner}</p>
            </div>
            <Button
              data-ocid="feed.profile_banner.button"
              size="sm"
              variant="outline"
              onClick={onProfile}
              className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {t.goToProfile}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Sub navigation bar with category hamburger */}
      <SubNavBar
        hasProfile={hasProfile}
        activeCategoryName={activeCategoryName}
        onHome={() => setActiveCatId(null)}
        onMyFeed={onMyFeed}
        onCreatePost={hasProfile ? onCreatePost : onProfile}
        onOpenCategories={() => setSheetOpen(true)}
        showMyFeed={!!identity && hasProfile}
        t={{
          home: t.home,
          myFeed: t.myFeed,
          newPost: t.newPost,
          categories: t.categories,
        }}
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {isLoading ? (
          <div data-ocid="feed.posts.loading_state" className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5"
              >
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="feed.posts.empty_state"
            className="py-20 text-center leaf-bg-empty"
          >
            <BookOpen
              className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4"
              strokeWidth={1}
            />
            <p className="text-muted-foreground">{t.noPostsYet}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                categoryName={catMap.get(post.categoryId) ?? t.unknownCategory}
                liked={likedSet.has(post.id)}
                onClick={() => onPost(post.id)}
                index={i + 1}
                pinnedLabel={t.pinned}
                lang={lang}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB – New post */}
      <button
        type="button"
        data-ocid="feed.create_post.button"
        onClick={hasProfile ? onCreatePost : onProfile}
        disabled={false}
        className={`fixed bottom-8 right-8 z-30 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg active:scale-95 transition-all text-sm font-medium touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          hasProfile
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
        }`}
        aria-label={t.newPost}
      >
        <PenLine className="w-4 h-4" />
        {t.newPost}
      </button>

      {/* Category bottom sheet */}
      <CategoryBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories ?? []}
        activeCatId={activeCatId}
        onSelect={setActiveCatId}
        t={{
          categories: t.categories,
          allPosts: t.allPosts,
          closeCategories: t.closeCategories,
        }}
      />

      <ScrollToTop />

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border leaf-bg-footer">
        © {new Date().getFullYear()}.
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
