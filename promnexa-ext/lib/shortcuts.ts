export function matchesShortcut(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "altKey" | "metaKey" | "shiftKey"
  >,
  shortcut: string,
): boolean {
  const parts = shortcut.toLowerCase().split("+");
  const key = parts.pop();
  return (
    event.key.toLowerCase() === key &&
    event.ctrlKey === parts.includes("ctrl") &&
    event.altKey === parts.includes("alt") &&
    event.metaKey === parts.includes("meta") &&
    event.shiftKey === parts.includes("shift")
  );
}
