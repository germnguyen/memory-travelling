import { apiRequest } from "./apiClient";
import type { PresignedUploadRequest, PresignedUploadResponse } from "../types";

export const storageService = {
  async getPresignedUploadUrl(req: PresignedUploadRequest): Promise<PresignedUploadResponse> {
    return apiRequest<PresignedUploadResponse>("/storage/upload-url", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  async uploadFileToStorage(
    uploadUrl: string,
    file: File | Blob,
    contentType: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", contentType);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage direct upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Storage direct upload network error"));
      xhr.send(file);
    });
  },
};
