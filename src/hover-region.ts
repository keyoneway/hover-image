export function pointerIsInHoverRegion(node: Node | null, target: Node, popup: Node | null): boolean {
  return Boolean(node && (target.contains(node) || popup?.contains(node)));
}
