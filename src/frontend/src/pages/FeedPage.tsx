import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Heart,
  LogOut,
  PenLine,
  Pin,
  Search,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Post } from "../backend.d";
import AuthorName from "../components/AuthorName";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useIsAdmin,
  useListCategories,
  useListPosts,
  useMyLikedPosts,
  useMyProfile,
} from "../hooks/useQueries";

interface FeedPageProps {
  onPost: (id: string) => void;
  onCreatePost: () => void;
  onAdminPanel: () => void;
  onSearch: (query: string) => void;
}

function PostCard({
  post,
  categoryName,
  liked,
  onClick,
  index,
}: {
  post: Post;
  categoryName: string;
  liked: boolean;
  onClick: () => void;
  index: number;
}) {
  const date = new Date(Number(post.createdAt) / 1_000_000);

  return (
    <motion.article
      data-ocid={`feed.post.item.${index}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-md hover:border-primary/30 cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {post.pinned && (
            <Badge
              variant="secondary"
              className="text-xs gap-1 bg-primary/10 text-primary border-primary/20"
            >
              <Pin className="w-3 h-3" />
              Fastnålad
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

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
        <AuthorName principal={post.authorPrincipal} />
        <span>·</span>
        <time dateTime={date.toISOString()}>
          {date.toLocaleDateString("sv-SE", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>
    </motion.article>
  );
}

export default function FeedPage({
  onPost,
  onCreatePost,
  onAdminPanel,
  onSearch,
}: FeedPageProps) {
  const { clear } = useInternetIdentity();
  const { data: profile } = useMyProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: categories } = useListCategories();
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const { data: posts, isLoading } = useListPosts(activeCatId);
  const { data: likedPosts } = useMyLikedPosts();
  const [searchInput, setSearchInput] = useState("");

  const likedSet = new Set(likedPosts ?? []);

  const sorted = [...(posts ?? [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return Number(b.createdAt - a.createdAt);
  });

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) onSearch(q);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              HKLOblogg
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
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
                  placeholder="Sök inlägg…"
                  className="pl-8 h-8 w-40 text-sm"
                />
              </div>
            </form>
            {profile && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {profile.alias}
              </span>
            )}
            {isAdmin && (
              <Button
                data-ocid="feed.admin_panel.button"
                variant="outline"
                size="sm"
                onClick={onAdminPanel}
                className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Adminpanel</span>
              </Button>
            )}
            <Button
              data-ocid="feed.logout.button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Category filter */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-[57px] z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            data-ocid="feed.all.tab"
            onClick={() => setActiveCatId(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCatId === null
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Alla
          </button>
          {(categories ?? []).map((cat) => (
            <button
              type="button"
              key={cat.id}
              data-ocid="feed.category.tab"
              onClick={() => setActiveCatId(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCatId === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

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
          <div data-ocid="feed.posts.empty_state" className="py-20 text-center">
            <BookOpen
              className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4"
              strokeWidth={1}
            />
            <p className="text-muted-foreground">
              Inga inlägg ännu. Var den första att skriva!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                categoryName={catMap.get(post.categoryId) ?? "Okänd kategori"}
                liked={likedSet.has(post.id)}
                onClick={() => onPost(post.id)}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB – Nytt inlägg */}
      <button
        type="button"
        data-ocid="feed.create_post.button"
        onClick={onCreatePost}
        className="fixed bottom-8 right-8 z-30 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm font-medium"
        aria-label="Skapa nytt inlägg"
      >
        <PenLine className="w-4 h-4" />
        Nytt inlägg
      </button>

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
