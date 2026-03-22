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
import MediaUploader, {
  type StagedFile,
  compressImage,
} from "../components/MediaUploader";
import RichEditor from "../components/RichEditor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMediaUpload } from "../hooks/useMediaUpload";
import {
  useCreatePost,
  useEditPost,
  useGetPost,
  useIsAdmin,
  useListCategories,
  useRecordPostHash,
} from "../hooks/useQueries";
import { useLang } from "../locales/LanguageContext";
import { translations } from "../locales/translations";

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

async function computeContentHash(
  title: string,
  body: string,
  postId: string,
): Promise<string> {
  const content = `${title}||${body}||${postId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function PostForm({
  mode,
  postId,
  onBack,
  onSuccess,
  onAdminPanel,
}: PostFormProps) {
  const { clear } = useInternetIdentity();
  const { lang } = useLang();
  const t = translations[lang];
  const { data: isAdmin } = useIsAdmin();
  const { data: categories } = useListCategories();
  const { data: existingPost } = useGetPost(postId ?? null);
  const createPost = useCreatePost();
  const editPost = useEditPost();
  const recordPostHash = useRecordPostHash();
  const { uploadFiles, uploading, progress } = useMediaUpload();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
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
    if (!title.trim()) e.title = t.titleRequired;
    if (!stripHtml(body)) e.body = t.contentRequired;
    if (!categoryId) e.category = t.categoryRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (mode === "create") {
        const newPostId = await createPost.mutateAsync({
          title: title.trim(),
          body,
          categoryId,
        });

        // Record content hash for verification
        try {
          const hash = await computeContentHash(title.trim(), body, newPostId);
          await recordPostHash.mutateAsync({ postId: newPostId, hash });
        } catch {
          // Non-critical: hash recording failed
        }

        // Upload media if any staged files
        const validFiles = stagedFiles.filter((sf) => !sf.error);
        if (validFiles.length > 0 && newPostId) {
          try {
            const filesToUpload = await Promise.all(
              validFiles.map(async (sf) => {
                if (sf.compress && sf.file.type.startsWith("image/")) {
                  try {
                    return await compressImage(sf.file);
                  } catch {
                    return sf.file;
                  }
                }
                return sf.file;
              }),
            );
            await uploadFiles(filesToUpload, BigInt(newPostId), null);
          } catch {
            toast.warning(t.errorOccurred);
          }
        }

        toast.success(t.postCreated);
        onSuccess(newPostId ?? "");
      } else if (postId) {
        await editPost.mutateAsync({
          postId,
          title: title.trim(),
          body,
          categoryId,
        });

        // Upload any new media
        const validFiles = stagedFiles.filter((sf) => !sf.error);
        if (validFiles.length > 0) {
          try {
            const filesToUpload = await Promise.all(
              validFiles.map(async (sf) => {
                if (sf.compress && sf.file.type.startsWith("image/")) {
                  try {
                    return await compressImage(sf.file);
                  } catch {
                    return sf.file;
                  }
                }
                return sf.file;
              }),
            );
            await uploadFiles(filesToUpload, BigInt(postId), null);
          } catch {
            toast.warning(t.errorOccurred);
          }
        }

        // Record content hash for verification
        try {
          const hash = await computeContentHash(title.trim(), body, postId);
          await recordPostHash.mutateAsync({ postId, hash });
        } catch {
          // Non-critical: hash recording failed
        }

        toast.success(t.postUpdated);
        onSuccess(postId);
      }
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const isPending = createPost.isPending || editPost.isPending || uploading;

  return (
    <div className="min-h-screen leaf-bg-page flex flex-col">
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
              {t.back}
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <span className="font-display text-xl text-foreground">
                {t.blogTitle}
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
                <span className="hidden sm:inline">{t.adminPanel}</span>
              </Button>
            )}
            <Button
              data-ocid="postform.logout.button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
            >
              {t.logout}
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
            {mode === "create" ? t.createPost : t.editPost}
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
                {t.titleLabel}
              </Label>
              <Input
                data-ocid="postform.title.input"
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
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
                {t.categoryLabel}
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger
                  data-ocid="postform.category.select"
                  id="post-category"
                  className="w-full sm:w-64"
                >
                  <SelectValue placeholder={t.selectCategory} />
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
                {t.bodyLabel}
              </Label>
              <RichEditor
                value={body}
                onChange={setBody}
                placeholder={t.writeComment}
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

            {/* Media uploader */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                {t.mediaLabel}
              </Label>
              <MediaUploader
                stagedFiles={stagedFiles}
                onFilesChange={setStagedFiles}
                uploading={uploading}
                progress={progress}
                disabled={isPending}
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                data-ocid="postform.cancel.button"
                type="button"
                variant="ghost"
                onClick={onBack}
              >
                {t.cancel}
              </Button>
              <Button
                data-ocid="postform.submit.button"
                type="submit"
                disabled={isPending}
                className="gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "create" ? t.publish : t.update}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border leaf-bg-footer">
        © {new Date().getFullYear()}.{" "}
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
