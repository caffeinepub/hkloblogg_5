import {
  AlertDialog,
  AlertDialogAction,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  BellOff,
  BookOpen,
  Heart,
  LogOut,
  Pencil,
  Pin,
  PinOff,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import AuthorName from "../components/AuthorName";
import CommentsSection from "../components/CommentsSection";
import MediaGallery from "../components/MediaGallery";
import VideoPlayer from "../components/VideoPlayer";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeletePost,
  useFollowPost,
  useGetPost,
  useGetPostFollowerCount,
  useIsAdmin,
  useIsFollowingPost,
  useLikePost,
  useListCategories,
  useMyLikedPosts,
  usePinPost,
  useUnfollowPost,
} from "../hooks/useQueries";
import { useStorageClient } from "../hooks/useStorageClient";

interface PostViewProps {
  postId: string;
  onBack: () => void;
  onEdit: (postId: string) => void;
  onAdminPanel: () => void;
  onSearch: (query: string) => void;
}

export default function PostView({
  postId,
  onBack,
  onEdit,
  onAdminPanel,
  onSearch,
}: PostViewProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const { data: post, isLoading } = useGetPost(postId);
  const { data: likedPosts } = useMyLikedPosts();
  const { data: categories } = useListCategories();
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const pinPost = usePinPost();
  const followPost = useFollowPost();
  const unfollowPost = useUnfollowPost();
  const { data: isFollowing } = useIsFollowingPost(postId);
  const { data: followerCount } = useGetPostFollowerCount(postId);
  const { actor } = useActor();
  const storageClient = useStorageClient();
  const [searchInput, setSearchInput] = useState("");

  const { data: postMedia } = useQuery({
    queryKey: ["postMedia", postId],
    queryFn: async () => {
      if (!actor || !post) return [];
      return actor.getMediaForPost(BigInt(post.id));
    },
    enabled: !!actor && !!post,
  });

  const postImages = (postMedia ?? []).filter((m) => m.fileType === "image");
  const postVideos = (postMedia ?? []).filter((m) => m.fileType === "video");

  const likedSet = new Set(likedPosts ?? []);
  const isLiked = likedSet.has(postId);

  const categoryName =
    categories?.find((c) => c.id === post?.categoryId)?.name ??
    "Okänd kategori";

  const myPrincipal = identity?.getPrincipal().toString();
  const isAuthor =
    !!myPrincipal && !!post && myPrincipal === post.authorPrincipal.toString();

  const canEdit = isAdmin || isAuthor;
  const canDelete = isAdmin || isAuthor;

  const handleLike = async () => {
    try {
      await likePost.mutateAsync(postId);
    } catch {
      toast.error("Kunde inte gilla inlägget.");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Inlägget raderades.");
      onBack();
    } catch {
      toast.error("Kunde inte radera inlägget.");
    }
  };

  const handlePin = async () => {
    if (!post) return;
    try {
      await pinPost.mutateAsync({ postId, pinned: !post.pinned });
      toast.success(post.pinned ? "Inlägg lossades." : "Inlägg fastnålades.");
    } catch {
      toast.error("Kunde inte ändra fastnålning.");
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowPost.mutateAsync(postId);
        toast.success("Du följer inte längre inlägget.");
      } else {
        await followPost.mutateAsync(postId);
        toast.success("Du följer nu inlägget.");
      }
    } catch {
      toast.error("Kunde inte ändra följning.");
    }
  };

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
          <div className="flex items-center gap-3">
            <Button
              data-ocid="post.back.button"
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
              <span className="font-display text-xl text-foreground hidden sm:inline">
                HKLOblogg
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex items-center"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  data-ocid="post.search.input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Sök…"
                  className="pl-8 h-8 w-36 text-sm"
                />
              </div>
            </form>
            {isAdmin && (
              <Button
                data-ocid="post.admin_panel.button"
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
              data-ocid="post.logout.button"
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

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {isLoading ? (
          <div data-ocid="post.loading_state" className="space-y-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !post ? (
          <div data-ocid="post.error_state" className="py-20 text-center">
            <p className="text-muted-foreground">Inlägget hittades inte.</p>
            <Button variant="ghost" className="mt-4" onClick={onBack}>
              Tillbaka till flödet
            </Button>
          </div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {post.pinned && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-primary/10 text-primary border-primary/20"
                >
                  <Pin className="w-3 h-3" />
                  Fastnålad
                </Badge>
              )}
              <Badge variant="outline" className="text-muted-foreground">
                {categoryName}
              </Badge>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
              <span>Av</span>
              <AuthorName
                principal={post.authorPrincipal}
                className="font-medium text-foreground"
              />
              <span>·</span>
              <time
                dateTime={new Date(
                  Number(post.createdAt) / 1_000_000,
                ).toISOString()}
              >
                {new Date(
                  Number(post.createdAt) / 1_000_000,
                ).toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.updatedAt !== post.createdAt && (
                <>
                  <span>·</span>
                  <span className="italic">
                    Uppdaterad{" "}
                    {new Date(
                      Number(post.updatedAt) / 1_000_000,
                    ).toLocaleDateString("sv-SE")}
                  </span>
                </>
              )}
            </div>

            <Separator className="mb-8" />

            {/* Post body rendered as HTML */}
            <div
              className="prose prose-slate max-w-none text-foreground leading-relaxed"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: post body is HTML from backend
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            {/* Post media */}
            {postImages.length > 0 && (
              <MediaGallery
                mediaFiles={postImages}
                storageClient={storageClient}
              />
            )}
            {postVideos.map((video) => (
              <VideoPlayer
                key={video.id.toString()}
                blobKey={video.blobKey}
                fileName={video.fileName}
                storageClient={storageClient}
              />
            ))}

            <Separator className="mt-10 mb-6" />

            {/* Actions row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-ocid="post.like.button"
                  onClick={handleLike}
                  disabled={likePost.isPending}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    isLiked
                      ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? "fill-rose-500" : ""}`}
                  />
                  {post.likeCount.toString()}
                  {isLiked ? " Gillad" : " Gilla"}
                </button>

                {/* Follow button */}
                {identity && (
                  <button
                    type="button"
                    data-ocid="post.follow.button"
                    onClick={handleFollow}
                    disabled={followPost.isPending || unfollowPost.isPending}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      isFollowing
                        ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted"
                    }`}
                  >
                    {isFollowing ? (
                      <BellOff className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    {isFollowing ? "Avfölja" : "Följ inlägg"}
                    {followerCount !== undefined &&
                      followerCount > BigInt(0) && (
                        <span className="text-xs opacity-70">
                          · {followerCount.toString()}
                        </span>
                      )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    data-ocid="post.pin.button"
                    variant="outline"
                    size="sm"
                    onClick={handlePin}
                    disabled={pinPost.isPending}
                    className="gap-1.5"
                  >
                    {post.pinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5" />
                        Lossa
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        Nåla
                      </>
                    )}
                  </Button>
                )}

                {canEdit && (
                  <Button
                    data-ocid="post.edit.button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(postId)}
                    className="gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Redigera
                  </Button>
                )}

                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        data-ocid="post.delete.button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Radera
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-ocid="post.delete.dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Radera inlägg</AlertDialogTitle>
                        <AlertDialogDescription>
                          Är du säker på att du vill radera inlägget &ldquo;
                          {post.title}&rdquo;? Detta kan inte ångras.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="post.delete.cancel_button">
                          Avbryt
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-ocid="post.delete.confirm_button"
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Radera
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Comments */}
            <CommentsSection postId={postId} />
          </motion.article>
        )}
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
