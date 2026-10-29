export type ProviderErrorCode =
  | "AUTH"
  | "QUOTA"
  | "INVALID_MODEL"
  | "TIMEOUT"
  | "PARSE"
  | "TRUNCATED"
  | "NETWORK"
  | "INPUT"
  | "CONSENT"
  | "SENSITIVE"
  | "UNKNOWN";
const messages: Record<ProviderErrorCode, string> = {
  AUTH: "Provider authentication failed. Check your API key.",
  QUOTA: "Provider quota or rate limit reached.",
  INVALID_MODEL:
    "The provider rejected the model or request configuration. Check the model ID and your access.",
  TIMEOUT: "The provider request timed out. Try again.",
  PARSE: "The provider returned invalid structured output.",
  TRUNCATED: "The provider response was truncated. Shorten the input or retry.",
  NETWORK: "Could not reach the provider.",
  INPUT: "The request exceeds the configured input limit or is invalid.",
  CONSENT: "Enable optional AI data sharing in the popup first.",
  SENSITIVE:
    "Sensitive information detected. Review or redact it before sending.",
  UNKNOWN: "AI request failed. The local engine is available.",
};
export class ProviderError extends Error {
  code: ProviderErrorCode;
  constructor(code: ProviderErrorCode) {
    super(messages[code]);
    this.name = "ProviderError";
    this.code = code;
  }
}
export function safeProviderError(error: unknown): {
  code: ProviderErrorCode;
  message: string;
} {
  const code =
    error instanceof ProviderError
      ? error.code
      : error instanceof DOMException &&
          ["TimeoutError", "AbortError"].includes(error.name)
        ? "TIMEOUT"
        : error instanceof SyntaxError
          ? "PARSE"
          : error instanceof TypeError
            ? "NETWORK"
            : "UNKNOWN";
  return { code, message: messages[code] };
}
export function errorForStatus(status: number): ProviderError {
  return new ProviderError(
    status === 401 || status === 403
      ? "AUTH"
      : status === 429
        ? "QUOTA"
        : status === 400 || status === 404
          ? "INVALID_MODEL"
          : "NETWORK",
  );
}

export async function errorForResponse(
  response: Response,
): Promise<ProviderError> {
  let codes: string[] = [];
  try {
    const data = await response.json();
    codes = [
      data.error?.code,
      data.error?.type,
      data.error?.status,
      ...(Array.isArray(data.error?.details)
        ? data.error.details.map((d: { reason?: string }) => d.reason)
        : []),
    ].filter((v: unknown): v is string => typeof v === "string");
  } catch {
    /* Do not surface provider bodies or messages. */
  }
  if (
    codes.some((code) =>
      [
        "invalid_api_key",
        "API_KEY_INVALID",
        "UNAUTHENTICATED",
        "authentication_error",
      ].includes(code),
    )
  )
    return new ProviderError("AUTH");
  return errorForStatus(response.status);
}
