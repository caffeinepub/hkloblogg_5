import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Heart,
  LogOut,
  Pin,
  Rss,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { Post } from "../backend.d";
import AuthorName from "../components/AuthorName";
import NotificationBell from "../components/NotificationBell";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetFollowedPosts,
  useGetFollowedUsersPosts,
  useListCategories,
  useMyLikedPosts,
} from "../hooks/useQueries";
import { useLang } from "../locales/LanguageContext";
import { LANGUAGES, translations } from "../locales/translations";
import type { Language } from "../locales/translations";

interface MittFlodePageProps {
  onBack: () => void;
  onPost: (id: string) => void;
  onProfile: () => void;
}

function PostCard({
  post,
  categoryName,
  liked,
  onClick,
  index,
  pinnedLabel,
}: {
  post: Post;
  categoryName: string;
  liked: boolean;
  onClick: () => void;
  index: number;
  pinnedLabel: string;
}) {
  const date = new Date(Number(post.createdAt) / 1_000_000);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all duration-200"
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
            className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`}
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

function FollowedPostCard({
  postId,
  liked,
  onClick,
  index,
  catMap,
  unknownCategory,
  pinnedLabel,
}: {
  postId: string;
  liked: boolean;
  onClick: () => void;
  index: number;
  catMap: Map<string, string>;
  unknownCategory: string;
  pinnedLabel: string;
}) {
  const { actor } = useActor();
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPost(postId);
    },
    enabled: !!actor && !!postId,
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <PostCard
      post={post}
      categoryName={catMap.get(post.categoryId) ?? unknownCategory}
      liked={liked}
      onClick={onClick}
      index={index}
      pinnedLabel={pinnedLabel}
    />
  );
}

export default function MittFlodePage({
  onBack,
  onPost,
  onProfile: _onProfile,
}: MittFlodePageProps) {
  const { clear } = useInternetIdentity();
  const { data: followedUsersPosts, isLoading: loadingUserPosts } =
    useGetFollowedUsersPosts();
  const { data: followedPostIds, isLoading: loadingFollowedPosts } =
    useGetFollowedPosts();
  const { data: likedPosts } = useMyLikedPosts();
  const { data: categories } = useListCategories();
  const { lang, setLang } = useLang();
  const t = translations[lang];

  const likedSet = new Set(likedPosts ?? []);
  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const sortedUserPosts = [...(followedUsersPosts ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

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

      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground -ml-2"
              data-ocid="mitt_flode.back.button"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t.back}
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <span className="font-display text-xl text-foreground hidden sm:inline">
                {t.myFeedTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="text-xs text-muted-foreground bg-transparent border border-border rounded px-1 py-0.5 cursor-pointer hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Select language"
              data-ocid="mitt_flode.language.select"
            >
              {LANGUAGES.map(({ code, flag, label }) => (
                <option key={code} value={code}>
                  {flag} {label}
                </option>
              ))}
            </select>
            <NotificationBell onPost={onPost} t={notifT} />
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
              aria-label={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              {t.followedUsers}
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <Rss className="w-4 h-4" />
              {t.followedPosts}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            {loadingUserPosts ? (
              <div className="space-y-4">
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
            ) : sortedUserPosts.length === 0 ? (
              <div className="py-20 text-center leaf-bg-empty">
                <Users
                  className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4"
                  strokeWidth={1}
                />
                <p className="text-muted-foreground">{t.noPostsFromFollowed}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {t.startFollowingUsers}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedUserPosts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    categoryName={
                      catMap.get(post.categoryId) ?? t.unknownCategory
                    }
                    liked={likedSet.has(post.id)}
                    onClick={() => onPost(post.id)}
                    index={i + 1}
                    pinnedLabel={t.pinned}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts">
            {loadingFollowedPosts ? (
              <div className="space-y-4">
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
            ) : (followedPostIds ?? []).length === 0 ? (
              <div className="py-20 text-center leaf-bg-empty">
                <Rss
                  className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4"
                  strokeWidth={1}
                />
                <p className="text-muted-foreground">{t.noFollowedPosts}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {t.clickToFollowPost}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(followedPostIds ?? []).map((postId, i) => (
                  <FollowedPostCard
                    key={postId}
                    postId={postId}
                    liked={likedSet.has(postId)}
                    onClick={() => onPost(postId)}
                    index={i + 1}
                    catMap={catMap}
                    unknownCategory={t.unknownCategory}
                    pinnedLabel={t.pinned}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

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
