// Public datasets can contain credential-shaped examples. Never redistribute them unchanged.
export function redactCredentialPatterns(text) {
  return text.replace(/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-proj-[A-Za-z0-9_-]{30,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/g, '[REDACTED_CREDENTIAL]');
}
