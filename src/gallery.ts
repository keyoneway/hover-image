export const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;

interface ImageFile { path: string; name: string; stat: { mtime: number } }

export function orderedImages<T extends ImageFile>(files: T[]): T[] {
  return files.filter(file => IMAGE_EXTENSIONS.test(file.name))
    .sort((a, b) => b.stat.mtime - a.stat.mtime || a.path.localeCompare(b.path));
}

export function matchingImages<T extends { file: { path: string } }>(images: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  return needle ? images.filter(image => image.file.path.toLowerCase().includes(needle)) : images;
}

export function nextGalleryPage<T>(images: T[], offset: number, pageSize = 80): T[] {
  return images.slice(offset, offset + pageSize);
}
