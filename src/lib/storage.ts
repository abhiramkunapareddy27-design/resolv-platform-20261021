/** Storage boundary: no upload endpoint is exposed until a private provider is configured. */
export interface PrivateStorage {
  put(input: {
    ownerId: string;
    bytes: Uint8Array;
    contentType: string;
  }): Promise<{ key: string }>;
  signedReadUrl(key: string, ownerId: string): Promise<string>;
}
export function validateUpload(bytes: Uint8Array, contentType: string) {
  if (bytes.byteLength > 5 * 1024 * 1024)
    throw new Error("Files must be no larger than 5 MB.");
  if (!["image/png", "image/jpeg", "application/pdf"].includes(contentType))
    throw new Error("Unsupported file type.");
}
export const storage: PrivateStorage = {
  async put() {
    throw new Error("Private file storage is not configured.");
  },
  async signedReadUrl() {
    throw new Error("Private file storage is not configured.");
  },
};
