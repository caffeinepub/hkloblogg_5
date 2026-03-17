import { useState } from "react";
import { useActor } from "./useActor";
import { useStorageClient } from "./useStorageClient";

export function useMediaUpload() {
  const { actor } = useActor();
  const storageClient = useStorageClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (
    files: File[],
    postId: bigint | null,
    commentId: bigint | null,
  ) => {
    if (!actor || !storageClient) throw new Error("Inte initialiserad");
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes, (p: number) => {
          setProgress(((i + p) / files.length) * 100);
        });
        const fileType = file.type.startsWith("image/") ? "image" : "video";
        await actor.uploadMedia(
          postId,
          commentId,
          fileType,
          file.name,
          BigInt(file.size),
          hash,
        );
        setProgress(((i + 1) / files.length) * 100);
      }
    } catch (e) {
      setError("Kunde inte ladda upp filen. Försök igen.");
      throw e;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading, progress, error };
}
