const attr = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = (value: string): string => attr(value).replace(/'/g, '&#39;');
const unattr = (value: string): string => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const MARKUP = /<(a|span)\b[^>]*\bdata-hover-id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/g;

export function findBinding(source: string, id: string): { start: number; end: number; markup: string } | null {
  for (const match of source.matchAll(MARKUP)) {
    if (match[2] === id && match.index !== undefined) {
      return { start: match.index, end: match.index + match[0].length, markup: match[0] };
    }
  }
  return null;
}

export function bindImage(source: string, imagePath: string, id: string): string {
  if (!source.trim() || !imagePath.trim()) throw new Error('Text and image path are required');
  const original = attr(encodeURIComponent(source));
  const base = `class="hover-image-target" data-hover-id="${attr(id)}" data-hover-image="${attr(imagePath)}" data-hover-original="${original}"`;
  const md = source.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
  if (md) return `<a href="${attr(md[2])}" ${base}>${html(md[1])}</a>`;
  if (/^https?:\/\/[^\s<>]+$/.test(source)) return `<a href="${attr(source)}" ${base}>${html(source)}</a>`;
  return `<span ${base}>${html(source)}</span>`;
}

export function imagePathFromMarkup(markup: string): string | null {
  const match = markup.match(/\bdata-hover-image="([^"]*)"/);
  return match ? unattr(match[1]) : null;
}

export function changeImage(markup: string, imagePath: string): string {
  if (!imagePath.trim() || !imagePathFromMarkup(markup)) throw new Error('Invalid image binding');
  return markup.replace(/\bdata-hover-image="[^"]*"/, `data-hover-image="${attr(imagePath)}"`);
}

export function removeImage(markup: string): string {
  const match = markup.match(/\bdata-hover-original="([^"]*)"/);
  if (!match) throw new Error('Invalid image binding');
  return decodeURIComponent(unattr(match[1]));
}

export function restoreImageBelow(source: string, id: string, embed: string): string {
  const binding = findBinding(source, id);
  if (!binding) throw new Error('未在当前笔记找到关联，请重新打开笔记。');
  const restored = source.slice(0, binding.start) + removeImage(binding.markup) + source.slice(binding.end);
  const lineBreak = restored.indexOf('\n', binding.start);
  const lineEnd = lineBreak < 0 ? restored.length : lineBreak > 0 && restored[lineBreak - 1] === '\r' ? lineBreak - 1 : lineBreak;
  const newline = lineBreak > 0 && restored[lineBreak - 1] === '\r' ? '\r\n' : '\n';
  const nextContent = restored.slice(lineBreak < 0 ? restored.length : lineBreak + 1).split(/\r?\n/).find(line => line.trim())?.trim();
  if (nextContent === embed) return restored;
  return restored.slice(0, lineEnd) + newline + embed + restored.slice(lineEnd);
}
