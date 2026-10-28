interface LinkRect { left: number; top: number; width: number; bottom: number }
interface Size { width: number; height: number }

export function popupPosition(link: LinkRect, popup: Size, viewport: Size): { left: number; top: number } {
  const anchor = link.left + link.width * 0.6;
  const left = Math.max(8, Math.min(anchor, viewport.width - popup.width - 8));
  const below = link.bottom + 8;
  const top = below + popup.height > viewport.height - 8
    ? Math.max(8, link.top - popup.height - 8)
    : below;
  return { left, top };
}
