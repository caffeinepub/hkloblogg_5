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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Loader2, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Comment } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateComment,
  useDeleteComment,
  useEditComment,
  useIsAdmin,
  useIsModerator,
  useLikeComment,
  useListComments,
  useMyLikedComments,
} from "../hooks/useQueries";
import AuthorName from "./AuthorName";
import EmojiPicker from "./EmojiPicker";
import RichEditor from "./RichEditor";

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  likedSet: Set<string>;
  myPrincipal: string | undefined;
  isAdmin: boolean;
  isModerator: boolean;
  postId: string;
  depth: number;
  index: number;
}

function CommentItem({
  comment,
  allComments,
  likedSet,
  myPrincipal,
  isAdmin,
  isModerator,
  postId,
  depth,
  index,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const likeComment = useLikeComment();
  const deleteComment = useDeleteComment();
  const createComment = useCreateComment();
  const editComment = useEditComment();

  const isLiked = likedSet.has(comment.id);
  const isAuthor =
    !!myPrincipal && myPrincipal === comment.authorPrincipal.toString();
  const canEdit = isAuthor || isModerator;
  const canDelete = isAuthor || isAdmin || isModerator;

  // Only render replies up to depth 3
  const replies =
    depth < 3 ? allComments.filter((c) => c.parentId === comment.id) : [];

  const handleLike = async () => {
    try {
      await likeComment.mutateAsync({ commentId: comment.id, postId });
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
      toast.success("Gillat! ❤️");
    } catch {
      toast.error("Kunde inte gilla kommentaren.");
    }
  };

  const handleReply = async () => {
    if (!stripHtml(replyBody)) return;
    try {
      await createComment.mutateAsync({
        postId,
        body: replyBody,
        parentId: comment.id,
      });
      setReplyBody("");
      setShowReplyForm(false);
      toast.success("Svar skickat.");
    } catch {
      toast.error("Kunde inte skicka svaret.");
    }
  };

  const handleEdit = async () => {
    if (!stripHtml(editBody)) return;
    try {
      await editComment.mutateAsync({
        commentId: comment.id,
        body: editBody,
        postId,
      });
      setEditing(false);
      toast.success("Kommentar uppdaterad.");
    } catch {
      toast.error("Kunde inte uppdatera kommentaren.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync({ commentId: comment.id, postId });
      toast.success("Kommentar raderad.");
    } catch {
      toast.error("Kunde inte radera kommentaren.");
    }
  };

  return (
    <motion.div
      data-ocid={`comments.item.${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`${
        depth === 1
          ? "ml-6 pl-4 border-l-2 border-primary/40 bg-primary/[0.02]"
          : depth === 2
            ? "ml-6 pl-4 border-l-2 border-amber-400/40 bg-amber-50/30"
            : depth >= 3
              ? "ml-6 pl-4 border-l-2 border-muted-foreground/30"
              : ""
      }`}
    >
      <div className="bg-card border border-border rounded-xl p-4 mb-2">
        {/* Author + time */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <AuthorName
              principal={comment.authorPrincipal}
              className="font-semibold text-foreground"
            />
            <span className="text-muted-foreground text-xs">
              {formatDate(comment.createdAt)}
            </span>
          </div>
        </div>

        {/* Body / Edit form */}
        {editing ? (
          <div className="space-y-2">
            <div className="comment-edit-editor">
              <RichEditor
                value={editBody}
                onChange={setEditBody}
                placeholder="Redigera kommentar…"
                minHeight={80}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                data-ocid="comments.edit.save_button"
                size="sm"
                onClick={handleEdit}
                disabled={editComment.isPending}
              >
                {editComment.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                Spara
              </Button>
              <Button
                data-ocid="comments.edit.cancel_button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setEditBody(comment.body);
                }}
              >
                Avbryt
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-slate max-w-none text-sm text-foreground leading-relaxed"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: comment body is HTML from backend
            dangerouslySetInnerHTML={{ __html: comment.body }}
          />
        )}

        {/* Action row */}
        {!editing && (
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <button
              type="button"
              data-ocid={`comments.like.button.${index}`}
              onClick={handleLike}
              disabled={likeComment.isPending}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${likeAnimating ? "like-pulse " : ""}${
                isLiked
                  ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? "fill-rose-500" : ""}`} />
              {comment.likeCount.toString()}
            </button>

            <button
              type="button"
              data-ocid={`comments.reply.button.${index}`}
              onClick={() => setShowReplyForm((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <MessageCircle className="w-3 h-3" />
              Svara
            </button>

            {canEdit && (
              <button
                type="button"
                data-ocid={`comments.edit_button.${index}`}
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                <Pencil className="w-3 h-3" />
                Redigera
              </button>
            )}

            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    data-ocid={`comments.delete_button.${index}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent text-destructive/60 hover:text-destructive hover:border-destructive/20 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    Radera
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent data-ocid="comments.delete.dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Radera kommentar</AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill radera kommentaren? Detta kan
                      inte ångras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-ocid="comments.delete.cancel_button">
                      Avbryt
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-ocid="comments.delete.confirm_button"
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
        )}
      </div>

      {/* Inline reply form */}
      {showReplyForm && (
        <div className="ml-6 mb-2 space-y-2">
          <div className="reply-editor">
            <RichEditor
              value={replyBody}
              onChange={setReplyBody}
              placeholder="Skriv ett svar…"
              minHeight={80}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              data-ocid="comments.reply.submit_button"
              size="sm"
              onClick={handleReply}
              disabled={createComment.isPending || !stripHtml(replyBody)}
            >
              {createComment.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Skicka svar
            </Button>
            <Button
              data-ocid="comments.reply.cancel_button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowReplyForm(false);
                setReplyBody("");
              }}
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {replies.map((reply, i) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          allComments={allComments}
          likedSet={likedSet}
          myPrincipal={myPrincipal}
          isAdmin={isAdmin}
          isModerator={isModerator ?? false}
          postId={postId}
          depth={depth + 1}
          index={index * 100 + i + 1}
        />
      ))}
    </motion.div>
  );
}

interface CommentsSectionProps {
  postId: string;
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const { data: isModerator } = useIsModerator();
  const { data: comments, isLoading } = useListComments(postId);
  const { data: likedComments } = useMyLikedComments();
  const createComment = useCreateComment();

  const [newBody, setNewBody] = useState("");

  const myPrincipal = identity?.getPrincipal().toString();
  const likedSet = new Set(likedComments ?? []);

  // Top-level comments only
  const topLevel = (comments ?? []).filter((c) => !c.parentId);
  const allComments = comments ?? [];

  const handleSubmit = async () => {
    if (!stripHtml(newBody)) return;
    try {
      await createComment.mutateAsync({
        postId,
        body: newBody,
        parentId: null,
      });
      setNewBody("");
      toast.success("Kommentar publicerad.");
    } catch {
      toast.error("Kunde inte publicera kommentaren.");
    }
  };

  return (
    <section data-ocid="comments.section" className="mt-10">
      <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
        Kommentarer
        {comments && (
          <span className="text-muted-foreground font-sans text-base font-normal">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* New comment form */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <RichEditor
          value={newBody}
          onChange={setNewBody}
          placeholder="Skriv en kommentar…"
          minHeight={100}
        />
        <div className="mt-3">
          <Button
            data-ocid="comments.new.submit_button"
            size="sm"
            onClick={handleSubmit}
            disabled={createComment.isPending || !stripHtml(newBody)}
          >
            {createComment.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : null}
            Kommentera
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div data-ocid="comments.loading_state" className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-4"
            >
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <div
          data-ocid="comments.empty_state"
          className="py-10 text-center text-muted-foreground text-sm"
        >
          Inga kommentarer ännu. Var den första att kommentera!
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((comment, i) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={allComments}
              likedSet={likedSet}
              myPrincipal={myPrincipal}
              isAdmin={isAdmin ?? false}
              isModerator={isModerator ?? false}
              postId={postId}
              depth={0}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
