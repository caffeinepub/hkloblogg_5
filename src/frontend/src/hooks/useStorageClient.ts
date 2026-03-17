import { HttpAgent } from "@icp-sdk/core/agent";
import { useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

export function useStorageClient(): StorageClient | null {
  const [storageClient, setStorageClient] = useState<StorageClient | null>(
    null,
  );

  useEffect(() => {
    loadConfig().then((config) => {
      const agent = new HttpAgent({ host: config.backend_host });
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      setStorageClient(client);
    });
  }, []);

  return storageClient;
}
