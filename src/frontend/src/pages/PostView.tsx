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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Heart,
  LogOut,
  Pencil,
  Pin,
  PinOff,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import AuthorName from "../components/AuthorName";
import CommentsSection from "../components/CommentsSection";
import MediaGallery from "../components/MediaGallery";
import MobileMenu from "../components/MobileMenu";
import ScrollToTop from "../components/ScrollToTop";
import VideoPlayer from "../components/VideoPlayer";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeletePost,
  useFollowPost,
  useFollowUser,
  useGetPost,
  useGetPostFollowerCount,
  useGetPostHashHistory,
  useIsAdmin,
  useIsFollowingPost,
  useIsFollowingUser,
  useIsModerator,
  useLikePost,
  useListCategories,
  useMyLikedPosts,
  usePinPost,
  useUnfollowPost,
  useUnfollowUser,
} from "../hooks/useQueries";
import { useStorageClient } from "../hooks/useStorageClient";
import { readTime } from "../lib/readTime";

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
  const { data: isModerator } = useIsModerator();
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
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const { data: isFollowingAuthor } = useIsFollowingUser(post?.authorPrincipal);
  const { actor } = useActor();
  const storageClient = useStorageClient();
  const [searchInput, setSearchInput] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [verifyPostId, setVerifyPostId] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState<string>("");
  const [canisterId, setCanisterId] = useState<string>("");
  const [hashCopied, setHashCopied] = useState(false);
  const { data: hashHistory } = useGetPostHashHistory(verifyPostId);
  const [likeAnimating, setLikeAnimating] = useState(false);

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

  const canEdit = isAdmin || isModerator || isAuthor;
  const canDelete = isAdmin || isModerator || isAuthor;

  const handleLike = async () => {
    try {
      await likePost.mutateAsync(postId);
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
      toast.success("Gillat! ❤️");
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

  const handleFollowAuthor = async () => {
    if (!post) return;
    try {
      if (isFollowingAuthor) {
        await unfollowUser.mutateAsync(post.authorPrincipal);
        toast.success("Du följer inte längre författaren.");
      } else {
        await followUser.mutateAsync(post.authorPrincipal);
        toast.success("Du följer nu författaren.");
      }
    } catch {
      toast.error("Kunde inte ändra följning.");
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

  const handleVerify = async () => {
    if (!post) return;
    const titleVal = post.title;
    const bodyVal = post.body;
    const postIdVal = post.id;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${titleVal}||${bodyVal}||${postIdVal}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setCurrentHash(hash);
    setVerifyPostId(postIdVal);
    try {
      const cfg = await loadConfig();
      setCanisterId(cfg.backend_canister_id);
    } catch {
      setCanisterId("");
    }
    setShowVerify(true);
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(currentHash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) onSearch(q);
  };

  return (
    <div className="min-h-screen leaf-bg-page flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              data-ocid="post.back.button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground -ml-2 focus-visible:ring-2 focus-visible:ring-ring"
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
            {/* Search bar – desktop */}
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

            {/* Admin panel – desktop */}
            {isAdmin && (
              <Button
                data-ocid="post.admin_panel.button"
                variant="outline"
                size="sm"
                onClick={onAdminPanel}
                className="hidden sm:flex gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Adminpanel</span>
              </Button>
            )}

            {/* Logout – desktop */}
            <Button
              data-ocid="post.logout.button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="hidden sm:flex text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile hamburger menu */}
            <MobileMenu onAdminPanel={onAdminPanel} onSearch={onSearch} />
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
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
              <button
                type="button"
                onClick={onBack}
                className="hover:text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Hem
              </button>
              <span>›</span>
              <span className="truncate max-w-[140px]">{categoryName}</span>
              <span>›</span>
              <span className="truncate max-w-[200px] text-foreground/70">
                {post.title.length > 40
                  ? `${post.title.slice(0, 40)}…`
                  : post.title}
              </span>
            </nav>

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
              {identity && !isAuthor && (
                <button
                  type="button"
                  onClick={handleFollowAuthor}
                  disabled={followUser.isPending || unfollowUser.isPending}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isFollowingAuthor
                      ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted"
                  }`}
                >
                  {isFollowingAuthor ? (
                    <UserCheck className="w-3 h-3" />
                  ) : (
                    <UserPlus className="w-3 h-3" />
                  )}
                  {isFollowingAuthor ? "Följer" : "Följ"}
                </button>
              )}
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
              <span>·</span>
              <span>{readTime(post.body)}</span>
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
                  className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${likeAnimating ? "like-pulse " : ""}${
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
                    className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

                {/* Verify button - visible to all */}
                <button
                  type="button"
                  data-ocid="post.verify.button"
                  onClick={handleVerify}
                  className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50 transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verifiera
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    data-ocid="post.pin.button"
                    variant="outline"
                    size="sm"
                    onClick={handlePin}
                    disabled={pinPost.isPending}
                    className="gap-1.5 focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="gap-1.5 focus-visible:ring-2 focus-visible:ring-ring"
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
                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
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

      <ScrollToTop />

      {/* Verify Dialog */}
      <Dialog open={showVerify} onOpenChange={setShowVerify}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Verifiera äkthet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Nedanstående hash beräknas från inläggets titel, innehåll och ID.
              Om hashen matchar kan du bekräfta att texten är oförändrad.
            </p>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  Aktuell innehållshash (SHA-256)
                </span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {hashCopied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {hashCopied ? "Kopierad" : "Kopiera"}
                </button>
              </div>
              <code className="block w-full bg-muted p-2 rounded text-xs font-mono break-all text-foreground">
                {currentHash || "Beräknar..."}
              </code>
            </div>

            {canisterId && (
              <a
                href={`https://dashboard.internetcomputer.org/canister/${canisterId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Visa canister på ICP Dashboard
              </a>
            )}

            {hashHistory && hashHistory.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="w-4 h-4" />
                  Versionshistorik
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {[...hashHistory].reverse().map((entry, i) => (
                    <div
                      key={`${entry[0]}-${entry[1]}`}
                      className="bg-muted rounded p-2 space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {i === 0
                            ? "Aktuell version"
                            : `Version ${hashHistory.length - i}`}
                        </span>
                        <span>
                          {new Date(
                            Number(entry[1]) / 1_000_000,
                          ).toLocaleString("sv-SE")}
                        </span>
                      </div>
                      <code className="block text-xs font-mono break-all text-foreground/80">
                        {entry[0]}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
