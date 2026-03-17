import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ImageIcon, Loader2, Upload, VideoIcon, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const TARGET_COMPRESS_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30 MB
const MAX_VIDEO_DURATION = 3 * 60; // 3 minutes in seconds

export interface StagedFile {
  file: File;
  compress: boolean;
  error?: string;
}

interface MediaUploaderProps {
  stagedFiles: StagedFile[];
  onFilesChange: (files: StagedFile[]) => void;
  uploading?: boolean;
  progress?: number;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function validateVideo(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration > MAX_VIDEO_DURATION) {
        resolve(
          `Videon är längre än 3 minuter (${Math.round(video.duration / 60)} min).`,
        );
      } else {
        resolve(null);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("Kunde inte läsa videofilen. Kontrollera formatet.");
    };
  });
}

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      // Scale down if needed
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Try quality 0.8 first, then lower if still too big
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Komprimering misslyckades"));
            return;
          }
          if (blob.size <= TARGET_COMPRESS_SIZE) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
            return;
          }
          // Try lower quality
          canvas.toBlob(
            (blob2) => {
              if (!blob2) {
                reject(new Error("Komprimering misslyckades"));
                return;
              }
              resolve(new File([blob2], file.name, { type: "image/jpeg" }));
            },
            "image/jpeg",
            0.5,
          );
        },
        "image/jpeg",
        0.8,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Kunde inte läsa bildfilen"));
    };
    img.src = url;
  });
}

export default function MediaUploader({
  stagedFiles,
  onFilesChange,
  uploading = false,
  progress = 0,
  disabled = false,
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validating, setValidating] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setValidating(true);
    const newStaged: StagedFile[] = [];

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type === "video/mp4" || file.type === "video/webm";

      if (!isImage && !isVideo) {
        newStaged.push({
          file,
          compress: false,
          error: "Filtypen stöds inte. Använd bilder eller MP4-videor.",
        });
        continue;
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        newStaged.push({
          file,
          compress: false,
          error: `Bilden är för stor (${formatSize(file.size)}). Max 15 MB.`,
        });
        continue;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        newStaged.push({
          file,
          compress: false,
          error: `Videon är för stor (${formatSize(file.size)}). Max 30 MB.`,
        });
        continue;
      }

      if (isVideo) {
        const err = await validateVideo(file);
        if (err) {
          newStaged.push({ file, compress: false, error: err });
          continue;
        }
      }

      newStaged.push({ file, compress: false });
    }

    setValidating(false);
    onFilesChange([...stagedFiles, ...newStaged]);

    // Reset input so same file can be re-added
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    onFilesChange(stagedFiles.filter((_, i) => i !== idx));
  };

  const toggleCompress = (idx: number, checked: boolean) => {
    onFilesChange(
      stagedFiles.map((f, i) => (i === idx ? { ...f, compress: checked } : f)),
    );
  };

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div className="flex items-center gap-3">
        <Button
          data-ocid="media.upload_button"
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || validating}
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {validating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Lägg till media
        </Button>
        <span className="text-xs text-muted-foreground">
          Bilder: max 15 MB. Videor: MP4, max 30 MB, max 3 minuter.
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Staged file list */}
      {stagedFiles.length > 0 && (
        <div className="space-y-2">
          {stagedFiles.map((sf, idx) => {
            const isImage = sf.file.type.startsWith("image/");
            return (
              <div
                key={`${sf.file.name}-${idx}`}
                className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                  sf.error
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0 text-muted-foreground">
                  {isImage ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <VideoIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {sf.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(sf.file.size)}
                  </p>
                  {sf.error && (
                    <p
                      data-ocid="media.error_state"
                      className="text-xs text-destructive mt-1"
                    >
                      {sf.error}
                    </p>
                  )}
                  {isImage && !sf.error && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <Checkbox
                        id={`compress-${idx}`}
                        checked={sf.compress}
                        onCheckedChange={(checked) =>
                          toggleCompress(idx, checked === true)
                        }
                        disabled={uploading}
                      />
                      <Label
                        htmlFor={`compress-${idx}`}
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Komprimera till ~1 MB
                      </Label>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid={`media.delete_button.${idx + 1}`}
                  onClick={() => removeFile(idx)}
                  disabled={uploading}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                  aria-label="Ta bort fil"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div data-ocid="media.loading_state" className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Laddar upp…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
