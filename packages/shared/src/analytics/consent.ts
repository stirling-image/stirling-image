import type { ConsentState } from "./types.js";

export function shouldShowConsent(consent: ConsentState, serverEnabled: boolean): boolean {
  if (!serverEnabled) return false;
  if (consent.analyticsEnabled !== null) return false;
  if (consent.analyticsConsentShownAt === null) return true;
  if (consent.analyticsConsentRemindAt === null) return false;
  return Date.now() >= consent.analyticsConsentRemindAt;
}

export function isConsentEnabled(consent: ConsentState, serverEnabled: boolean): boolean {
  if (!serverEnabled) return false;
  return consent.analyticsEnabled === true;
}
