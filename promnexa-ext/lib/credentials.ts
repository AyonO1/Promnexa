import type { AIProviderConfig } from "./types";
const KEY = "promnexa_credentials";
interface Credential {
  provider: string;
  apiKey: string;
}
let memory: Credential | null = null;
export async function restrictStorageAccess(): Promise<void> {
  const local = browser.storage.local as typeof browser.storage.local & {
    setAccessLevel?: (options: { accessLevel: string }) => Promise<void>;
  };
  if (local.setAccessLevel)
    await local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
}
export async function readCredential(provider: string): Promise<string> {
  const session = browser.storage.session;
  const ephemeral = session
    ? ((await session.get(KEY))[KEY] as Credential | undefined)
    : memory;
  if (ephemeral?.provider === provider) return ephemeral.apiKey;
  const persisted = (await browser.storage.local.get(KEY))[KEY] as
    | Credential
    | undefined;
  return persisted?.provider === provider ? persisted.apiKey : "";
}
export async function writeCredential(
  config: AIProviderConfig | null,
): Promise<void> {
  const credential = config?.apiKey
    ? { provider: config.provider, apiKey: config.apiKey }
    : null;
  const session = browser.storage.session;
  if (session)
    await session.set({ [KEY]: config?.rememberApiKey ? null : credential });
  else memory = config?.rememberApiKey ? null : credential;
  await browser.storage.local.set({
    [KEY]: config?.rememberApiKey ? credential : null,
  });
}
export async function clearCredentials(): Promise<void> {
  memory = null;
  if (browser.storage.session) await browser.storage.session.remove(KEY);
}
