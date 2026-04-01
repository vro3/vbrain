/**
 * File upload service — uploads to Firebase Storage, returns download URL.
 * Files stored under brain-attachments/{timestamp}_{filename}
 * Created: 2026-04-01
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase-client';

const storage = getStorage(app);

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `brain-attachments/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { originalName: file.name },
  });

  const url = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url,
    type: file.type,
    size: file.size,
  };
}

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  return Promise.all(files.map(uploadFile));
}
