import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import type { StorageClient } from "../utils/StorageClient";

interface VideoPlayerProps {
  blobKey: string;
  fileName: string;
  storageClient: StorageClient | null;
}

export default function VideoPlayer({
  blobKey,
  fileName,
  storageClient,
}: VideoPlayerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!storageClient || !blobKey) return;
    storageClient
      .getDirectURL(blobKey)
      .then(setUrl)
      .catch(() => setError(true));
  }, [blobKey, storageClient]);

  if (error) {
    return (
      <div
        data-ocid="video.error_state"
        className="rounded-lg bg-muted border border-border p-4 text-sm text-muted-foreground text-center"
      >
        Kunde inte ladda videon.
      </div>
    );
  }

  if (!url) {
    return <Skeleton className="w-full aspect-video rounded-lg" />;
  }

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-border bg-black">
      {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded video */}
      <video
        controls
        className="w-full max-h-[480px] object-contain"
        src={url}
        title={fileName}
        preload="metadata"
      />
    </div>
  );
}
