export { getStorageClient, getDefaultBucket, getPublicBaseUrl, resetStorageClient } from "./client";

export {
  uploadFile,
  createPresignedUpload,
  createPresignedDownload,
  deleteFile,
  deleteFiles,
  fileExists,
  listFiles,
  copyFile,
  keyToUrl,
  urlToKey,
} from "./upload";

export {
  mimeToExtension,
  isImageMime,
  isDocumentMime,
  isVideoMime,
  formatBytes,
  sanitizeFilename,
  buildEntityKey,
  validateUpload,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_ATTACHMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_VIDEO_SIZE,
  MAX_ATTACHMENT_SIZE,
} from "./helpers";

export type {
  StorageBucket,
  AssetFolder,
  UploadOptions,
  UploadResult,
  PresignedUploadResult,
  DeleteOptions,
  ListOptions,
  StorageObject,
} from "./types";
