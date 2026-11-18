// Navigation policy only; this does not authorize access to protected content.
export function bookDestination(id: string, premium: boolean, entitled = false, listen = false): string | null {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return null;
  // UI navigation consumes verified server entitlement; content routes enforce it independently.
  return premium && !entitled ? '/choose-plan' : `/player/${id}${listen ? "?mode=listen" : ""}`;
}

export function authReturnPath(value?: string): string {
  return value && /^(?:\/book\/[a-zA-Z0-9_-]{1,128}|\/settings|\/choose-plan(?:\?plan=(?:monthly|annual))?)$/.test(value) ? value : '/for-you';
}
