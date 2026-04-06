import type { Post } from "@/backend";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListComments, useListPosts } from "@/hooks/useQueries";
import { useLang } from "@/locales/LanguageContext";
import { translations } from "@/locales/translations";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface TopPostsSidebarProps {
  onPost: (postId: string) => void;
}

// Most commented list — each item fetches its own count, sorted by comment count
function MostCommentedList({
  posts,
  onPost,
}: {
  posts: Post[];
  onPost: (id: string) => void;
}) {
  return <CommentSortedList posts={posts} onPost={onPost} />;
}

// Lifts comment counts into state and sorts the list
function CommentSortedList({
  posts,
  onPost,
}: {
  posts: Post[];
  onPost: (id: string) => void;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleCount = (postId: string, count: number) => {
    setCounts((prev) => {
      if (prev[postId] === count) return prev;
      return { ...prev, [postId]: count };
    });
  };

  const sortedPosts = [...posts].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0),
  );

  return (
    <div className="space-y-0.5">
      {sortedPosts.map((post, i) => (
        <CommentCountItem
          key={post.id}
          post={post}
          rank={i + 1}
          onPost={onPost}
          onCount={handleCount}
        />
      ))}
    </div>
  );
}

function CommentCountItem({
  post,
  rank,
  onPost,
  onCount,
}: {
  post: Post;
  rank: number;
  onPost: (id: string) => void;
  onCount: (postId: string, count: number) => void;
}) {
  const { data: comments } = useListComments(post.id);
  const count = comments?.length ?? 0;

  // Report count to parent for sorting
  if (comments !== undefined) {
    onCount(post.id, count);
  }

  return (
    <button
      type="button"
      onClick={() => onPost(post.id)}
      className="w-full text-left group flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-accent/60 transition-colors"
      data-ocid={`sidebar.comment.item.${rank}`}
    >
      <span className="text-xs font-bold text-muted-foreground/60 w-4 shrink-0 pt-0.5">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <MessageCircle className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{count}</span>
        </div>
      </div>
    </button>
  );
}

export default function TopPostsSidebar({ onPost }: TopPostsSidebarProps) {
  const { lang } = useLang();
  const t = translations[lang];
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: allPosts, isLoading } = useListPosts(null);

  // Most liked: sort by likeCount descending, top 10
  const mostLiked = allPosts
    ? [...allPosts]
        .sort((a, b) => Number(b.likeCount) - Number(a.likeCount))
        .slice(0, 10)
    : [];

  // Most commented pre-filter: top 20 by likeCount as a reasonable proxy
  const top20ForComments = allPosts
    ? [...allPosts]
        .sort((a, b) => Number(b.likeCount) - Number(a.likeCount))
        .slice(0, 20)
    : [];

  const SidebarContent = (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
        <TrendingUp className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
          {t.topPosts ?? "Top Posts"}
        </span>
      </div>

      {isLoading ? (
        <div className="p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-3 w-3 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="liked" className="w-full">
          <TabsList className="w-full rounded-none border-b border-border bg-muted/20 h-8">
            <TabsTrigger
              value="liked"
              className="flex-1 text-[11px] h-7 data-[state=active]:bg-background"
              data-ocid="sidebar.liked.tab"
            >
              <Heart className="w-3 h-3 mr-1" />
              {t.mostLiked ?? "Most Liked"}
            </TabsTrigger>
            <TabsTrigger
              value="commented"
              className="flex-1 text-[11px] h-7 data-[state=active]:bg-background"
              data-ocid="sidebar.commented.tab"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              {t.mostCommented ?? "Most Commented"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liked" className="m-0">
            <div className="p-2 space-y-0.5 max-h-96 overflow-y-auto">
              {mostLiked.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t.noPostsYet ?? "No posts yet."}
                </p>
              ) : (
                mostLiked.map((post, i) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onPost(post.id)}
                    className="w-full text-left group flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-accent/60 transition-colors"
                    data-ocid={`sidebar.liked.item.${i + 1}`}
                  >
                    <span className="text-xs font-bold text-muted-foreground/60 w-4 shrink-0 pt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Heart className="w-3 h-3 text-rose-400" />
                        <span className="text-[10px] text-muted-foreground">
                          {Number(post.likeCount)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="commented" className="m-0">
            <div className="p-2 max-h-96 overflow-y-auto">
              {top20ForComments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t.noPostsYet ?? "No posts yet."}
                </p>
              ) : (
                <MostCommentedList posts={top20ForComments} onPost={onPost} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: fixed right panel, only on xl+ */}
      <div
        className="fixed right-4 top-20 bottom-4 w-56 z-10 hidden xl:flex flex-col gap-2 overflow-y-auto"
        data-ocid="sidebar.panel"
      >
        {SidebarContent}
      </div>

      {/* Mobile: collapsible section — rendered inline via App.tsx below main page content */}
      <div
        className="xl:hidden mt-6 px-4 pb-6"
        data-ocid="sidebar.mobile.panel"
      >
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-card border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-accent/40 transition-colors"
          data-ocid="sidebar.mobile.toggle"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="tracking-wide uppercase">
              {t.topPosts ?? "Top Posts"}
            </span>
          </div>
          {mobileOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
        {mobileOpen && <div className="mt-2">{SidebarContent}</div>}
      </div>
    </>
  );
}
