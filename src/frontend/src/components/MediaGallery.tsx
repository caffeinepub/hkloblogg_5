import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MediaFile } from "../backend.d";
import type { StorageClient } from "../utils/StorageClient";

interface MediaGalleryProps {
  mediaFiles: MediaFile[];
  storageClient: StorageClient | null;
}

export default function MediaGallery({
  mediaFiles,
  storageClient,
}: MediaGalleryProps) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!storageClient || mediaFiles.length === 0) return;

    Promise.all(
      mediaFiles.map(async (mf) => {
        try {
          const url = await storageClient.getDirectURL(mf.blobKey);
          return [mf.blobKey, url] as [string, string];
        } catch {
          return [mf.blobKey, ""] as [string, string];
        }
      }),
    ).then((entries) => {
      setUrls(Object.fromEntries(entries.filter(([, url]) => url)));
    });
  }, [mediaFiles, storageClient]);

  if (mediaFiles.length === 0) return null;

  const currentUrl =
    lightboxIndex !== null ? urls[mediaFiles[lightboxIndex]?.blobKey] : null;

  const goNext = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % mediaFiles.length : 0,
    );

  const goPrev = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + mediaFiles.length) % mediaFiles.length : 0,
    );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) {
      goNext(); // left swipe = next
    } else {
      goPrev(); // right swipe = prev
    }
  };

  return (
    <>
      <div
        className={`grid gap-2 mt-3 ${
          mediaFiles.length === 1
            ? "grid-cols-1"
            : mediaFiles.length === 2
              ? "grid-cols-2"
              : mediaFiles.length === 3
                ? "grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4"
        }`}
      >
        {mediaFiles.map((mf, idx) => {
          const url = urls[mf.blobKey];
          return (
            <button
              key={mf.id.toString()}
              type="button"
              data-ocid={`media.item.${idx + 1}`}
              onClick={() => setLightboxIndex(idx)}
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            >
              {url ? (
                <img
                  src={url}
                  alt={mf.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Skeleton className="w-full h-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
      >
        <DialogContent
          data-ocid="media.dialog"
          className="max-w-3xl w-full p-2 bg-background/95 border-border"
        >
          <div
            className="relative select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentUrl ? (
              <img
                src={currentUrl}
                alt={
                  lightboxIndex !== null
                    ? mediaFiles[lightboxIndex]?.fileName
                    : ""
                }
                className="w-full max-h-[80vh] object-contain rounded-lg pointer-events-none"
                draggable={false}
              />
            ) : (
              <Skeleton className="w-full aspect-video rounded-lg" />
            )}

            {/* Navigation */}
            {mediaFiles.length > 1 && (
              <>
                <button
                  type="button"
                  data-ocid="media.pagination_prev"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background transition-colors border border-border touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Föregående bild"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  data-ocid="media.pagination_next"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background transition-colors border border-border touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Nästa bild"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Close */}
            <button
              type="button"
              data-ocid="media.close_button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-2 right-2 bg-background/80 rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background transition-colors border border-border touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Stäng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Counter */}
            {mediaFiles.length > 1 && lightboxIndex !== null && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 rounded-full px-3 py-1 text-xs text-foreground border border-border">
                {lightboxIndex + 1} / {mediaFiles.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
