import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import RichEditor from "../components/RichEditor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreatePost,
  useEditPost,
  useGetPost,
  useIsAdmin,
  useListCategories,
} from "../hooks/useQueries";

interface PostFormProps {
  mode: "create" | "edit";
  postId?: string;
  onBack: () => void;
  onSuccess: (postId: string) => void;
  onAdminPanel: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function PostForm({
  mode,
  postId,
  onBack,
  onSuccess,
  onAdminPanel,
}: PostFormProps) {
  const { clear } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const { data: categories } = useListCategories();
  const { data: existingPost } = useGetPost(postId ?? null);
  const createPost = useCreatePost();
  const editPost = useEditPost();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [errors, setErrors] = useState<{
    title?: string;
    body?: string;
    category?: string;
  }>({});

  // Pre-fill on edit
  useEffect(() => {
    if (mode === "edit" && existingPost) {
      setTitle(existingPost.title);
      setBody(existingPost.body);
      setCategoryId(existingPost.categoryId);
    }
  }, [mode, existingPost]);

  // Set first category as default for create mode
  useEffect(() => {
    if (
      mode === "create" &&
      categories &&
      categories.length > 0 &&
      !categoryId
    ) {
      setCategoryId(categories[0].id);
    }
  }, [mode, categories, categoryId]);

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = "Titel krävs.";
    if (!stripHtml(body)) e.body = "Innehåll krävs.";
    if (!categoryId) e.category = "Välj en kategori.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (mode === "create") {
        await createPost.mutateAsync({
          title: title.trim(),
          body,
          categoryId,
        });
        toast.success("Inlägget publicerades!");
        onSuccess("");
      } else if (postId) {
        await editPost.mutateAsync({
          postId,
          title: title.trim(),
          body,
          categoryId,
        });
        toast.success("Ändringarna sparades!");
        onSuccess(postId);
      }
    } catch {
      toast.error(
        mode === "create"
          ? "Kunde inte publicera inlägget."
          : "Kunde inte spara ändringarna.",
      );
    }
  };

  const isPending = createPost.isPending || editPost.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              data-ocid="postform.back.button"
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
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                data-ocid="postform.admin_panel.button"
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
              data-ocid="postform.logout.button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
            >
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl text-foreground mb-8">
            {mode === "create" ? "Nytt inlägg" : "Redigera inlägg"}
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-card space-y-6"
          >
            {/* Title */}
            <div className="space-y-2">
              <Label
                htmlFor="post-title"
                className="text-foreground font-medium"
              >
                Titel
              </Label>
              <Input
                data-ocid="postform.title.input"
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Inläggets titel"
                maxLength={200}
                className="text-base"
              />
              {errors.title && (
                <p
                  data-ocid="postform.title.error_state"
                  className="text-xs text-destructive"
                >
                  {errors.title}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label
                htmlFor="post-category"
                className="text-foreground font-medium"
              >
                Kategori
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger
                  data-ocid="postform.category.select"
                  id="post-category"
                  className="w-full sm:w-64"
                >
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p
                  data-ocid="postform.category.error_state"
                  className="text-xs text-destructive"
                >
                  {errors.category}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label
                htmlFor="post-body"
                className="text-foreground font-medium"
              >
                Innehåll
              </Label>
              <RichEditor
                value={body}
                onChange={setBody}
                placeholder="Skriv ditt inlägg här..."
                minHeight={280}
              />
              {errors.body && (
                <p
                  data-ocid="postform.body.error_state"
                  className="text-xs text-destructive"
                >
                  {errors.body}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                data-ocid="postform.cancel.button"
                type="button"
                variant="ghost"
                onClick={onBack}
              >
                Avbryt
              </Button>
              <Button
                data-ocid="postform.submit.button"
                type="submit"
                disabled={isPending}
                className="gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "create" ? "Publicera" : "Spara ändringar"}
              </Button>
            </div>
          </form>
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
