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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
  MessageCircle,
  Pin,
  PinOff,
  Plus,
  Shield,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import type { Category, Comment, Post, UserProfile } from "../backend.d";
import type { Comment as CommentType } from "../backend.d";
import AuthorName from "../components/AuthorName";
import { useActor } from "../hooks/useActor";
import {
  useCreateCategory,
  useDeleteCategory,
  useDeleteComment,
  useDeletePost,
  useListCategories,
  useListPosts,
  useListUsers,
  usePinPost,
} from "../hooks/useQueries";

interface AdminPanelProps {
  onBack: () => void;
}

function CategoryRow({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const deleteCategory = useDeleteCategory();

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success(`Kategori "${category.name}" raderad.`);
    } catch {
      toast.error("Kunde inte radera kategorin.");
    }
  };

  return (
    <TableRow data-ocid={`admin.categories.item.${index}`}>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(Number(category.createdAt) / 1_000_000).toLocaleDateString(
          "sv-SE",
        )}
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-ocid={`admin.categories.delete_button.${index}`}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="admin.categories.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Radera kategori</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill radera kategorin &ldquo;
                {category.name}&rdquo;? Detta kan inte ångras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.categories.cancel_button">
                Avbryt
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.categories.confirm_button"
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Radera
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

function UserRow({ user, index }: { user: UserProfile; index: number }) {
  const isAdmin = user.role === UserRole.admin;

  const handleBlock = async () => {
    toast.error(
      "Blockeringsfunktion kräver principal-lookup (implementeras i fas 3).",
    );
  };

  const handleRoleToggle = async () => {
    toast.error("Rollbyte kräver principal-lookup (implementeras i fas 3).");
  };

  return (
    <TableRow
      data-ocid={`admin.users.item.${index}`}
      className={user.blocked ? "opacity-60" : ""}
    >
      <TableCell className="font-medium">{user.alias}</TableCell>
      <TableCell>
        <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
          {isAdmin ? "Admin" : "Användare"}
        </Badge>
      </TableCell>
      <TableCell>
        {user.blocked ? (
          <Badge variant="destructive" className="text-xs">
            Blockerad
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Aktiv
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            data-ocid={`admin.users.toggle.${index}`}
            variant="ghost"
            size="sm"
            onClick={handleBlock}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            {user.blocked ? "Avblockera" : "Blockera"}
          </Button>
          <Button
            data-ocid={`admin.users.edit_button.${index}`}
            variant="ghost"
            size="sm"
            onClick={handleRoleToggle}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            {isAdmin ? "Ta bort admin" : "Gör admin"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AdminPostRow({
  post,
  index,
  catName,
}: { post: Post; index: number; catName: string }) {
  const deletePost = useDeletePost();
  const pinPost = usePinPost();

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Inlägget raderades.");
    } catch {
      toast.error("Kunde inte radera inlägget.");
    }
  };

  const handlePin = async () => {
    try {
      await pinPost.mutateAsync({ postId: post.id, pinned: !post.pinned });
      toast.success(post.pinned ? "Inlägg lossades." : "Inlägg fastnålades.");
    } catch {
      toast.error("Kunde inte ändra fastnålning.");
    }
  };

  return (
    <TableRow data-ocid={`admin.posts.item.${index}`}>
      <TableCell className="font-medium max-w-48 truncate">
        <div className="flex items-center gap-1.5">
          {post.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
          <span className="truncate">{post.title}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <AuthorName principal={post.authorPrincipal} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{catName}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString(
          "sv-SE",
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            data-ocid={`admin.posts.toggle.${index}`}
            variant="ghost"
            size="sm"
            onClick={handlePin}
            disabled={pinPost.isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            {post.pinned ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                data-ocid={`admin.posts.delete_button.${index}`}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deletePost.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="admin.posts.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Radera inlägg</AlertDialogTitle>
                <AlertDialogDescription>
                  Är du säker på att du vill radera &ldquo;{post.title}&rdquo;?
                  Detta kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="admin.posts.cancel_button">
                  Avbryt
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="admin.posts.confirm_button"
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Radera
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function useAllComments() {
  const { actor, isFetching } = useActor();
  return useQuery<CommentType[]>({
    queryKey: ["admin", "allComments"],
    queryFn: async () => {
      if (!actor) return [];
      // We don't have a listAllComments endpoint — fetch comments for each post
      // For now return empty; actual data requires per-post fetching
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

function AdminCommentRow({
  comment,
  index,
}: { comment: Comment; index: number }) {
  const deleteComment = useDeleteComment();

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync({
        commentId: comment.id,
        postId: comment.postId,
      });
      toast.success("Kommentar raderad.");
    } catch {
      toast.error("Kunde inte radera kommentaren.");
    }
  };

  return (
    <TableRow data-ocid={`admin.comments.item.${index}`}>
      <TableCell className="max-w-64">
        <p className="truncate text-sm text-foreground">{comment.body}</p>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <AuthorName principal={comment.authorPrincipal} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(Number(comment.createdAt) / 1_000_000).toLocaleDateString(
          "sv-SE",
        )}
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-ocid={`admin.comments.delete_button.${index}`}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={deleteComment.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="admin.comments.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Radera kommentar</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill radera kommentaren? Detta kan inte
                ångras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.comments.cancel_button">
                Avbryt
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.comments.confirm_button"
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Radera
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { data: categories, isLoading: loadingCats } = useListCategories();
  const { data: users, isLoading: loadingUsers } = useListUsers();
  const { data: posts, isLoading: loadingPosts } = useListPosts(null);
  const { data: allComments, isLoading: loadingComments } = useAllComments();
  const createCategory = useCreateCategory();
  const [newCatName, setNewCatName] = useState("");
  const [catError, setCatError] = useState("");

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) {
      setCatError("Ange ett kategorinamn.");
      return;
    }
    setCatError("");
    try {
      await createCategory.mutateAsync(name);
      setNewCatName("");
      toast.success(`Kategori "${name}" skapad.`);
    } catch {
      toast.error("Kunde inte skapa kategorin.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            data-ocid="admin.back.button"
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
            <span className="font-display text-xl text-foreground">
              HKLOblogg
            </span>
          </div>
          <Badge className="ml-auto gap-1">
            <Shield className="h-3 w-3" /> Adminpanel
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl text-foreground mb-6">
            Adminpanel
          </h1>

          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger
                data-ocid="admin.categories.tab"
                value="categories"
                className="gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                Kategorier
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.users.tab"
                value="users"
                className="gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                Användare
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.posts.tab"
                value="posts"
                className="gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Inlägg
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.comments.tab"
                value="comments"
                className="gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Kommentarer
              </TabsTrigger>
            </TabsList>

            {/* ---- KATEGORIER ---- */}
            <TabsContent value="categories" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-card">
                <h2 className="font-semibold text-foreground mb-4">
                  Ny kategori
                </h2>
                <form
                  onSubmit={handleCreateCategory}
                  className="flex gap-2 flex-wrap"
                >
                  <div className="flex-1 min-w-48">
                    <Input
                      data-ocid="admin.categories.input"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Kategorinamn"
                      maxLength={50}
                      className="h-9"
                    />
                    {catError && (
                      <p
                        data-ocid="admin.categories.error_state"
                        className="text-xs text-destructive mt-1"
                      >
                        {catError}
                      </p>
                    )}
                  </div>
                  <Button
                    data-ocid="admin.categories.submit_button"
                    type="submit"
                    size="sm"
                    className="h-9 gap-1.5"
                    disabled={createCategory.isPending}
                  >
                    {createCategory.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Lägg till
                  </Button>
                </form>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">
                    Kategorier
                    {categories && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({categories.length})
                      </span>
                    )}
                  </h2>
                </div>
                {loadingCats ? (
                  <div
                    data-ocid="admin.categories.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !categories || categories.length === 0 ? (
                  <div
                    data-ocid="admin.categories.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    Inga kategorier ännu. Skapa den första ovan.
                  </div>
                ) : (
                  <Table data-ocid="admin.categories.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Namn</TableHead>
                        <TableHead>Skapad</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat, i) => (
                        <CategoryRow
                          key={cat.id}
                          category={cat}
                          index={i + 1}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ---- ANVÄNDARE ---- */}
            <TabsContent value="users" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">
                    Registrerade användare
                    {users && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({users.length})
                      </span>
                    )}
                  </h2>
                </div>
                {loadingUsers ? (
                  <div
                    data-ocid="admin.users.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !users || users.length === 0 ? (
                  <div
                    data-ocid="admin.users.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    Inga registrerade användare ännu.
                  </div>
                ) : (
                  <Table data-ocid="admin.users.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alias</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user, i) => (
                        <UserRow key={user.alias} user={user} index={i + 1} />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ---- INLÄGG ---- */}
            <TabsContent value="posts" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">
                    Alla inlägg
                    {posts && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({posts.length})
                      </span>
                    )}
                  </h2>
                </div>
                {loadingPosts ? (
                  <div
                    data-ocid="admin.posts.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !posts || posts.length === 0 ? (
                  <div
                    data-ocid="admin.posts.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    Inga inlägg ännu.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="admin.posts.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Författare</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead className="text-right">Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post, i) => (
                          <AdminPostRow
                            key={post.id}
                            post={post}
                            index={i + 1}
                            catName={catMap.get(post.categoryId) ?? "Okänd"}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ---- KOMMENTARER ---- */}
            <TabsContent value="comments" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">
                    Alla kommentarer
                    {allComments && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({allComments.length})
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kommentarer hanteras per inlägg. Gå till ett inlägg för att
                    se och radera kommentarer direkt.
                  </p>
                </div>
                {loadingComments ? (
                  <div
                    data-ocid="admin.comments.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !allComments || allComments.length === 0 ? (
                  <div
                    data-ocid="admin.comments.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    Kommentarer visas per inlägg. Besök ett inlägg för att
                    hantera dess kommentarer.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="admin.comments.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kommentar</TableHead>
                          <TableHead>Författare</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead className="text-right">Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allComments.map((comment, i) => (
                          <AdminCommentRow
                            key={comment.id}
                            comment={comment}
                            index={i + 1}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
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
