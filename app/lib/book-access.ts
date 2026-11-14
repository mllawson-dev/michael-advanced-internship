// Navigation policy only; this does not authorize access to protected content.
export function bookDestination(id: string, premium: boolean): string | null {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return null;
  // No verified entitlement provider exists yet: premium never unlocks on login alone.
  return premium ? '/choose-plan' : `/player/${id}`;
}

export function authReturnPath(value?: string): string {
  return value && /^\/book\/[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : '/for-you';
}
