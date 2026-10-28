export interface NoteImage {
  linkpath: string;
  line: number;
  raw: string;
  standalone: boolean;
}

export function scanNoteImages(source: string): NoteImage[] {
  const images: NoteImage[] = [];
  let inFence = false;
  for (const [line, text] of source.split('\n').entries()) {
    if (/^\s*(```|~~~)/.test(text)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const pattern = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]|!\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g;
    for (const match of text.matchAll(pattern)) {
      images.push({
        linkpath: (match[1] ?? match[2] ?? match[3]).trim(),
        line,
        raw: match[0],
        standalone: text.trim() === match[0],
      });
    }
  }
  return images;
}

export function adjacentImage(source: string, anchorLine: number, images: NoteImage[]): NoteImage | null {
  const lines = source.split('\n');
  for (let line = anchorLine + 1; line < lines.length; line++) {
    if (!lines[line].trim()) continue;
    return images.find(image => image.line === line && image.standalone) ?? null;
  }
  return null;
}
