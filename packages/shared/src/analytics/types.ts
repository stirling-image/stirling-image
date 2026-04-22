export interface AnalyticsConfig {
  enabled: boolean;
  posthogApiKey: string;
  posthogHost: string;
  sentryDsn: string;
  sampleRate: number;
  instanceId: string;
}

export interface ConsentState {
  analyticsEnabled: boolean | null;
  analyticsConsentShownAt: number | null;
  analyticsConsentRemindAt: number | null;
}
