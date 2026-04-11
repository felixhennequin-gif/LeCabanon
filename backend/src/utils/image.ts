import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { generateFileName } from "../middlewares/upload.js";

interface ProcessImageOptions {
  buffer: Buffer;
  folder: "avatars" | "equipment" | "reviews";
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function processAndSaveImage({
  buffer,
  folder,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 80,
}: ProcessImageOptions): Promise<string> {
  const fileName = generateFileName();
  const folderPath = path.join(UPLOADS_DIR, folder);
  const filePath = path.join(folderPath, fileName);

  await fs.mkdir(folderPath, { recursive: true });

  await sharp(buffer)
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toFile(filePath);

  return `/uploads/${folder}/${fileName}`;
}

export async function deleteImage(imagePath: string): Promise<void> {
  if (!imagePath) return;
  const fullPath = path.join(process.cwd(), imagePath);
  try {
    await fs.unlink(fullPath);
  } catch {
    // File already deleted or doesn't exist
  }
}
