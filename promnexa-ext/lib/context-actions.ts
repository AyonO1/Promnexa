export interface ContextAction {
  id: string;
  action: "optimize" | "explain" | "summarize" | "create-prompt";
  text: string;
  timestamp: number;
  sourceTabId?: number;
}
export const CONTEXT_TTL = 120000;
export function validContextAction(
  value: unknown,
  now = Date.now(),
  id?: string,
  sourceTabId?: number,
): value is ContextAction {
  const v = value as ContextAction | null;
  return (
    !!v &&
    typeof v.id === "string" &&
    (!id || id === v.id) &&
    ["optimize", "explain", "summarize", "create-prompt"].includes(v.action) &&
    typeof v.text === "string" &&
    v.text.length > 0 &&
    v.text.length <= 100000 &&
    Number.isFinite(v.timestamp) &&
    now - v.timestamp >= 0 &&
    now - v.timestamp <= CONTEXT_TTL &&
    (v.sourceTabId === undefined ||
      (Number.isInteger(v.sourceTabId) && v.sourceTabId >= 0)) &&
    (sourceTabId === undefined || v.sourceTabId === sourceTabId)
  );
}
const prefix = "promnexa_context_";
const store = () => browser.storage.session || browser.storage.local;
export async function queueContextAction(action: ContextAction) {
  const area = store();
  const all = await area.get(null);
  const pending = Object.entries(all).filter(
    ([key]) => key.startsWith(prefix) && key !== prefix + "latest",
  );
  const stale = pending
    .filter(([, v]) => !validContextAction(v))
    .map(([key]) => key);
  const live = pending
    .filter(([, v]) => validContextAction(v))
    .sort(
      (a, b) =>
        (b[1] as ContextAction).timestamp - (a[1] as ContextAction).timestamp,
    );
  await area.remove([...stale, ...live.slice(2).map(([key]) => key)]);
  await area.set({
    [prefix + action.id]: action,
    [prefix + "latest"]: action.id,
  });
}
export async function consumeContextAction(
  id?: string,
): Promise<ContextAction | null> {
  const area = store();
  const selected = id || (await area.get(prefix + "latest"))[prefix + "latest"];
  if (typeof selected !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(selected))
    return null;
  const key = prefix + selected;
  const data = (await area.get(key))[key];
  await area.remove(key);
  if ((await area.get(prefix + "latest"))[prefix + "latest"] === selected)
    await area.remove(prefix + "latest");
  return validContextAction(data, Date.now(), selected) ? data : null;
}
